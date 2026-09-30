import { TeamMember, Conversation } from "../models/index.js";
import { hashPassword } from "../utils/security.js";
export async function seed() {
  let admin = await TeamMember.findOne({
    where: { email: process.env.ADMIN_LOGIN || "user01@00" },
  });
  if (!admin)
    admin = await TeamMember.create({
      name: "مدير الفريق",
      email: process.env.ADMIN_LOGIN || "user01@00",
      passwordHash: await hashPassword(
        process.env.ADMIN_PASSWORD || "user01@00",
      ),
      title: "مدير مساحة العمل",
      team: "الإدارة",
      role: 200,
    });
  if (process.env.DEMO_MODE !== "true") return;
  const profiles = [
    ["أحمد المنصور", "ahmad@liqa.demo", "مصمم تجربة المستخدم", "فريق التصميم"],
    ["سارة العبدالله", "sara@liqa.demo", "مصممة واجهات", "فريق التصميم"],
    ["عمر خالد", "omar@liqa.demo", "مطور واجهات أمامية", "فريق التطوير"],
    ["نورة الحسن", "noura@liqa.demo", "مديرة المشروع", "إدارة المشاريع"],
    ["يوسف إبراهيم", "yousef@liqa.demo", "مطور تطبيقات", "فريق التطوير"],
    ["ريم محمد", "reem@liqa.demo", "استراتيجية المحتوى", "فريق التسويق"],
  ];
  const demoPassword = await hashPassword(
    (await import("node:crypto")).randomBytes(32).toString("hex"),
  );
  for (let i = 0; i < profiles.length; i++) {
    const [name, email, title, team] = profiles[i];
    await TeamMember.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        title,
        team,
        passwordHash: demoPassword,
        avatar: `/avatars/member-${i + 1}.jpg`,
      },
    });
  }
  if ((await Conversation.count()) === 0) {
    const rooms = [
      {
        name: "نصنع تجربة أفضل، معاً",
        project: "مشروع الهوية الرقمية",
        description: "مساحة للأفكار الكبيرة والتفاصيل الصغيرة",
        color: "blue",
      },
      {
        name: "من الفكرة إلى الإطلاق",
        project: "تطوير المنصة",
        description: "نبني اليوم ما يسهّل تجربة الغد",
        color: "purple",
      },
      {
        name: "أفكار تصل إلى الجميع",
        project: "الحملة التسويقية",
        description: "قصص ملهمة، وأثر يدوم",
        color: "gold",
      },
    ];
    const members = await TeamMember.findAll({ where: { role: 100 } });
    for (const [index, room] of rooms.entries()) {
      const c = await Conversation.create({
        ...room,
        createdBy: admin.id,
        scheduledAt: new Date(Date.now() + (index + 1) * 3600000),
      });
      await c.addTeamMembers(members.slice(index, index + 4));
    }
  }
}
