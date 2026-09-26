import { randomBytes, createHash } from "node:crypto";
import { Op } from "sequelize";
import { sequelize } from "../configs/database.js";
import { TeamMember, Conversation, Message, Session } from "../models/index.js";
import {
  hashPassword,
  verifyPassword,
  publicMember,
  validateMember,
} from "../utils/security.js";
const digest = (token) => createHash("sha256").update(token).digest("hex");
export function registerSockets(io) {
  const active = new Map(); // socket id -> member id and joined room
  const attempts = new Map();
  const connected = () => [
    ...new Set([...active.values()].map((v) => v.memberId)),
  ];
  const people = (roomId) =>
    [...active.entries()]
      .filter(([, v]) => v.roomId === roomId)
      .map(([socketId, v]) => ({ socketId, memberId: v.memberId }));
  const publishPresence = () => {
    const groupRooms = {};
    const privateRooms = {};
    for (const v of active.values())
      if (v.roomId) {
        const target = v.roomType === "private" ? privateRooms : groupRooms;
        target[v.roomId] = [
          ...new Set([...(target[v.roomId] || []), v.memberId]),
        ];
      }
    io.to("authenticated").emit("presence:update", {
      onlineIds: connected(),
      rooms: groupRooms,
    });
    io.to("admins").emit("admin:activity", privateRooms);
  };
  async function roomFor(socket, id) {
    if (typeof id !== "string") throw new Error("الغرفة غير صالحة");
    const room = await Conversation.findByPk(id);
    if (!room) throw new Error("الغرفة غير موجودة");
    if (
      room.type === "private" &&
      !(await room.hasTeamMember(socket.data.user.id))
    )
      throw new Error("غير مصرح لك بدخول هذه المحادثة");
    return room;
  }
  async function snapshot(socket) {
    const members = await TeamMember.findAll({ order: [["id", "ASC"]] });
    const rooms = await Conversation.findAll({
      where: { type: "group" },
      include: [{ model: TeamMember, attributes: ["id"] }],
      order: [["createdAt", "ASC"]],
    });
    socket.emit("workspace:update", {
      members: members.map(publicMember),
      conversations: rooms.map((r) => ({
        ...r.toJSON(),
        memberIds: r.TeamMembers.map((m) => m.id),
      })),
    });
    publishPresence();
  }
  async function refresh() {
    await Promise.all(
      [...io.sockets.sockets.values()].filter((s) => s.data.user).map(snapshot),
    );
  }
  function leave(socket) {
    const state = active.get(socket.id);
    if (state?.roomId) {
      socket.to(state.roomId).emit("peer:left", { socketId: socket.id });
      socket.leave(state.roomId);
      state.roomId = null;
      state.roomType = null;
      publishPresence();
    }
  }
  io.on("connection", (socket) => {
    let eventCount = 0;
    let windowStart = Date.now();
    // Preserve operation order so overlapping authentication and room changes cannot race.
    let operationQueue = Promise.resolve();
    function handle(event, fn, { auth = true, admin = false } = {}) {
      socket.on(event, (payload, ack) => {
        if (typeof ack !== "function") return;
        if (Date.now() - windowStart > 10000) {
          eventCount = 0;
          windowStart = Date.now();
        }
        if (++eventCount > 150) {
          ack({ ok: false, error: "طلبات كثيرة، يرجى الانتظار قليلاً" });
          return;
        }
        operationQueue = operationQueue.then(async () => {
          if (!socket.connected) return;
          try {
            if (
              auth &&
              (!socket.data.user || socket.data.expiresAt < Date.now())
            )
              throw new Error("يرجى تسجيل الدخول");
            if (admin && socket.data.user.role !== 200)
              throw new Error("غير مصرح لك بهذا الإجراء");
            ack({ ok: true, data: await fn(payload || {}) });
          } catch (error) {
            if (!error.message?.match(/[\u0600-\u06ff]/))
              console.error(event, error.name);
            ack({
              ok: false,
              error: error.message?.match(/[\u0600-\u06ff]/)
                ? error.message
                : "تعذر إتمام العملية، يرجى المحاولة مجدداً",
            });
          }
        });
      });
    }
    async function authenticate(member, existingToken, expiresAt) {
      if (socket.data.user) throw new Error("يرجى تسجيل الخروج أولاً");
      const token = existingToken || randomBytes(32).toString("hex");
      const expiry = expiresAt || new Date(Date.now() + 86400000);
      if (!existingToken)
        await Session.create({
          tokenHash: digest(token),
          memberId: member.id,
          expiresAt: expiry,
        });
      if (!socket.connected) throw new Error("انقطع الاتصال");
      socket.data.user = publicMember(member);
      socket.data.expiresAt = +new Date(expiry);
      active.set(socket.id, { memberId: member.id });
      socket.join("authenticated");
      if (member.role === 200) socket.join("admins");
      await snapshot(socket);
      const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
      if (process.env.TURN_URL)
        iceServers.push({
          urls: process.env.TURN_URL,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL,
        });
      return {
        user: publicMember(member),
        token,
        iceServers,
        demo: process.env.DEMO_MODE === "true",
      };
    }
    handle(
      "auth:resume",
      async ({ token }) => {
        if (typeof token !== "string" || token.length !== 64)
          throw new Error("انتهت الجلسة");
        const session = await Session.findOne({
          where: {
            tokenHash: digest(token),
            expiresAt: { [Op.gt]: new Date() },
          },
          include: TeamMember,
        });
        if (!session) throw new Error("انتهت الجلسة");
        return authenticate(session.TeamMember, token, session.expiresAt);
      },
      { auth: false },
    );
    handle(
      "auth:login",
      async ({ email, password }) => {
        const key = socket.handshake.address;
        let attempt = attempts.get(key);
        if (!attempt || Date.now() - attempt.at > 60000) {
          attempt = { count: 0, at: Date.now() };
          attempts.set(key, attempt);
        }
        if (++attempt.count > 15) throw new Error("محاولات كثيرة، انتظر دقيقة");
        if (typeof email !== "string" || email.length > 120)
          throw new Error("بيانات الدخول غير صحيحة");
        const member = await TeamMember.findOne({
          where: { email: email.trim().toLowerCase() },
        });
        if (!member || !(await verifyPassword(password, member.passwordHash)))
          throw new Error("بيانات الدخول غير صحيحة");
        return authenticate(member);
      },
      { auth: false },
    );
    handle(
      "auth:demo",
      async () => {
        if (process.env.DEMO_MODE !== "true")
          throw new Error("يرجى تسجيل الدخول");
        return authenticate(
          await TeamMember.findOne({ where: { email: "ahmad@liqa.demo" } }),
        );
      },
      { auth: false },
    );
    handle("auth:logout", async ({ token }) => {
      if (typeof token === "string")
        await Session.destroy({
          where: { tokenHash: digest(token), memberId: socket.data.user.id },
        });
      leave(socket);
      active.delete(socket.id);
      socket.leave("authenticated");
      socket.leave("admins");
      socket.data.user = null;
      publishPresence();
    });
    handle(
      "members:add",
      async (input) => {
        const fields = validateMember(input);
        if (await TeamMember.findOne({ where: { email: fields.email } }))
          throw new Error("البريد الإلكتروني مسجل مسبقاً");
        const member = await TeamMember.create({
          ...fields,
          passwordHash: await hashPassword(input.password),
        });
        await refresh();
        return publicMember(member);
      },
      { admin: true },
    );
    handle("rooms:create", async ({ name, project, scheduledAt }) => {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 120 ||
        typeof project !== "string" ||
        project.length > 120
      )
        throw new Error("يرجى إدخال اسم الاجتماع والمشروع");
      if (
        scheduledAt &&
        (!Number.isFinite(Date.parse(scheduledAt)) ||
          Date.parse(scheduledAt) < Date.now() - 60000)
      )
        throw new Error("يرجى اختيار موعد في المستقبل");
      const room = await Conversation.create({
        name: name.trim(),
        project: project.trim() || "اجتماع الفريق",
        createdBy: socket.data.user.id,
        scheduledAt: scheduledAt || null,
      });
      await room.addTeamMember(socket.data.user.id);
      await refresh();
      return room.toJSON();
    });
    handle("private:create", async ({ memberId }) => {
      if (
        !Number.isInteger(memberId) ||
        memberId === socket.data.user.id ||
        !(await TeamMember.findByPk(memberId))
      )
        throw new Error("يرجى اختيار عضو آخر");
      const id = socket.data.user.id;
      const room = await sequelize.transaction(async (transaction) => {
        const c = await Conversation.create(
          { name: "محادثة خاصة", type: "private", createdBy: id },
          { transaction },
        );
        await c.addTeamMembers([id, memberId], { transaction });
        return c;
      });
      for (const [sid, v] of active)
        if (v.memberId === memberId)
          io.to(sid).emit("private:invitation", {
            roomId: room.id,
            from: socket.data.user,
          });
      return room.toJSON();
    });
    handle("room:join", async ({ roomId }) => {
      const room = await roomFor(socket, roomId);
      if (!socket.connected) throw new Error("انقطع الاتصال");
      leave(socket);
      if (people(roomId).some((p) => p.memberId === socket.data.user.id))
        throw new Error("أنت متصل بهذا الاجتماع من نافذة أخرى");
      if (people(roomId).length >= 8)
        throw new Error("وصلت الغرفة إلى الحد الأقصى: 8 مشاركين");
      const peers = people(roomId);
      socket.join(roomId);
      active.set(socket.id, {
        memberId: socket.data.user.id,
        roomId,
        roomType: room.type,
      });
      const messages = await Message.findAll({
        where: { conversationId: roomId },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });
      publishPresence();
      return {
        room: room.toJSON(),
        peers,
        messages: messages.reverse().map((m) => m.toJSON()),
      };
    });
    handle("room:leave", async () => leave(socket));
    handle("signal:send", async ({ target, description, candidate }) => {
      const me = active.get(socket.id),
        other = active.get(target);
      if (!me?.roomId || me.roomId !== other?.roomId)
        throw new Error("المشارك غير موجود في الاجتماع");
      if (
        description &&
        (!["offer", "answer"].includes(description.type) ||
          typeof description.sdp !== "string" ||
          description.sdp.length > 50000)
      )
        throw new Error("إشارة غير صالحة");
      if (candidate && JSON.stringify(candidate).length > 4096)
        throw new Error("إشارة غير صالحة");
      io.to(target).emit("signal:receive", {
        from: socket.id,
        memberId: socket.data.user.id,
        description,
        candidate,
      });
    });
    handle("message:send", async ({ text }) => {
      const roomId = active.get(socket.id)?.roomId;
      if (!roomId) throw new Error("يرجى الانضمام إلى الاجتماع");
      if (typeof text !== "string" || !text.trim() || text.length > 2000)
        throw new Error("الرسالة يجب أن تكون بين 1 و2000 حرف");
      const m = await Message.create({
        text: text.trim(),
        memberId: socket.data.user.id,
        conversationId: roomId,
      });
      io.to(roomId).emit("message:new", m.toJSON());
      return m.toJSON();
    });
    socket.on("disconnect", () => {
      leave(socket);
      active.delete(socket.id);
      publishPresence();
    });
  });
  const cleanup = setInterval(() => {
    for (const [key, value] of attempts)
      if (Date.now() - value.at > 60000) attempts.delete(key);
    for (const socket of io.sockets.sockets.values())
      if (socket.data.expiresAt < Date.now()) socket.disconnect(true);
    Session.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } }).catch(
      console.error,
    );
  }, 60000);
  cleanup.unref();
}
