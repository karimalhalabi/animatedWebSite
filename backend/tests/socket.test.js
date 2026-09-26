import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";
import { once } from "node:events";
import { io } from "socket.io-client";
import mysql from "mysql2/promise";
try {
  loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const call = (socket, event, payload = {}) =>
  new Promise((resolve, reject) =>
    socket
      .timeout(5000)
      .emit(event, payload, (err, result) =>
        err ? reject(err) : resolve(result),
      ),
  );
const connect = async (url) => {
  const socket = io(url, { forceNew: true, transports: ["websocket"] });
  await once(socket, "connect");
  return socket;
};
test(
  "authenticated Socket.IO collaboration and persistence",
  { timeout: 30000 },
  async (t) => {
    const database = `liqa_test_${process.pid}`;
    const port = 32000 + (process.pid % 10000);
    const sockets = [];
    const server = spawn(process.execPath, ["server.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DB_NAME: database,
        PORT: String(port),
        DEMO_MODE: "true",
        ADMIN_LOGIN: "user01@00",
        ADMIN_PASSWORD: "user01@00",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    server.stdout.on("data", (d) => (logs += d));
    server.stderr.on("data", (d) => (logs += d));
    t.after(async () => {
      sockets.forEach((s) => s.disconnect());
      server.kill("SIGTERM");
      await new Promise((resolve) => {
        if (server.exitCode !== null) return resolve();
        server.once("exit", resolve);
        setTimeout(() => {
          server.kill("SIGKILL");
          resolve();
        }, 2000).unref();
      });
      const db = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT || 3306),
        socketPath: process.env.DB_SOCKET,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      await db.query(`DROP DATABASE IF EXISTS \`${database}\``);
      await db.end();
    });
    for (let i = 0; i < 100 && !logs.includes("Liqa server ready"); i++) {
      if (server.exitCode !== null) throw new Error(logs);
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.match(logs, /Liqa server ready/);
    const url = `http://127.0.0.1:${port}`;
    const admin = await connect(url),
      member = await connect(url),
      other = await connect(url),
      anonymous = await connect(url);
    sockets.push(admin, member, other, anonymous);
    let workspace,
      presence,
      activity,
      leakedActivity = false;
    member.on("workspace:update", (data) => (workspace = data));
    member.on("presence:update", (data) => (presence = data));
    member.on("admin:activity", () => (leakedActivity = true));
    admin.on("admin:activity", (data) => (activity = data));
    const a = await call(admin, "auth:login", {
      email: "user01@00",
      password: "user01@00",
    });
    assert.equal(a.data.user.role, 200);
    const m = await call(member, "auth:demo");
    assert.equal(m.data.user.role, 100);
    await t.test(
      "anonymous writes and member administrative writes are denied",
      async () => {
        assert.equal(
          (
            await call(anonymous, "rooms:create", {
              name: "غير مسموح",
              project: "x",
            })
          ).ok,
          false,
        );
        assert.equal((await call(member, "members:add", {})).ok, false);
        assert.equal(
          (await call(anonymous, "auth:resume", { token: "x".repeat(64) })).ok,
          false,
        );
      },
    );
    await t.test(
      "concurrent authentication cannot mix member and admin identities",
      async () => {
        const race = await connect(url);
        sockets.push(race);
        const results = await Promise.all([
          call(race, "auth:demo"),
          call(race, "auth:login", {
            email: "user01@00",
            password: "user01@00",
          }),
        ]);
        assert.equal(results.filter((r) => r.ok).length, 1);
        assert.equal((await call(race, "members:add", {})).ok, false);
        race.disconnect();
      },
    );
    let added;
    await t.test(
      "admin adds member, duplicate validation and login work",
      async () => {
        const data = {
          name: "عضو الاختبار",
          email: "integration@example.com",
          password: "test-password-123",
          title: "مطور",
          team: "التحقق",
          role: 100,
        };
        added = await call(admin, "members:add", data);
        assert.equal(added.ok, true);
        assert.equal((await call(admin, "members:add", data)).ok, false);
        assert.equal(
          (
            await call(other, "auth:login", {
              email: data.email,
              password: "wrong",
            })
          ).ok,
          false,
        );
        assert.equal((await call(other, "auth:login", data)).ok, true);
        assert.ok(workspace.members.some((x) => x.id === added.data.id));
      },
    );
    let group;
    await t.test(
      "group rooms, restricted signaling, and saved messages",
      async () => {
        group = await call(member, "rooms:create", {
          name: "اجتماع التحقق",
          project: "اختبارات",
        });
        assert.equal(group.ok, true);
        assert.equal(
          (await call(member, "room:join", { roomId: group.data.id })).ok,
          true,
        );
        const joined = await call(other, "room:join", {
          roomId: group.data.id,
        });
        assert.equal(joined.data.peers.length, 1);
        assert.equal(
          (
            await call(member, "signal:send", {
              target: anonymous.id,
              description: { type: "offer", sdp: "test" },
            })
          ).ok,
          false,
        );
        const signal = once(other, "signal:receive");
        assert.equal(
          (
            await call(member, "signal:send", {
              target: other.id,
              description: { type: "offer", sdp: "test" },
            })
          ).ok,
          true,
        );
        assert.equal((await signal)[0].memberId, m.data.user.id);
        assert.equal(
          (await call(member, "message:send", { text: "مرحباً بالفريق" })).ok,
          true,
        );
        await call(other, "room:leave");
        const again = await call(other, "room:join", { roomId: group.data.id });
        assert.equal(again.data.messages[0].text, "مرحباً بالفريق");
      },
    );
    await t.test(
      "private room invitations and membership cannot be bypassed by admin",
      async () => {
        await call(member, "room:leave");
        await call(other, "room:leave");
        const invite = once(other, "private:invitation");
        const privateRoom = await call(member, "private:create", {
          memberId: added.data.id,
        });
        assert.equal((await invite)[0].roomId, privateRoom.data.id);
        assert.equal(
          (await call(admin, "room:join", { roomId: privateRoom.data.id })).ok,
          false,
        );
        assert.equal(
          (await call(member, "room:join", { roomId: privateRoom.data.id })).ok,
          true,
        );
        assert.equal(
          (await call(other, "room:join", { roomId: privateRoom.data.id })).ok,
          true,
        );
        await new Promise((r) => setTimeout(r, 30));
        assert.deepEqual(
          new Set(activity[privateRoom.data.id]),
          new Set([m.data.user.id, added.data.id]),
        );
        assert.equal(presence.rooms[privateRoom.data.id], undefined);
        assert.equal(leakedActivity, false);
      },
    );
    await t.test(
      "session resume and multi-tab presence survive one tab leaving",
      async () => {
        const resumed = await connect(url);
        sockets.push(resumed);
        assert.equal(
          (await call(resumed, "auth:resume", { token: m.data.token })).data
            .user.id,
          m.data.user.id,
        );
        member.disconnect();
        await new Promise((r) => setTimeout(r, 30));
        let latest;
        resumed.on("presence:update", (p) => (latest = p));
        await call(other, "room:leave");
        assert.ok(latest.onlineIds.includes(m.data.user.id));
        assert.equal(
          (await call(resumed, "auth:logout", { token: m.data.token })).ok,
          true,
        );
        assert.equal(
          (await call(anonymous, "auth:resume", { token: m.data.token })).ok,
          false,
        );
      },
    );
  },
);
