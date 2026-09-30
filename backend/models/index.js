import { DataTypes } from "sequelize";
import { sequelize } from "../configs/database.js";
export const TeamMember = sequelize.define(
  "TeamMember",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: false },
    team: { type: DataTypes.STRING(120), allowNull: false },
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: { isIn: [[100, 200]] },
    },
    avatar: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "team_members" },
);
export const Conversation = sequelize.define(
  "Conversation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    type: {
      type: DataTypes.ENUM("group", "private"),
      allowNull: false,
      defaultValue: "group",
    },
    description: { type: DataTypes.STRING(255), defaultValue: "" },
    project: { type: DataTypes.STRING(120), defaultValue: "الفريق" },
    color: { type: DataTypes.STRING(20), defaultValue: "blue" },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "conversations" },
);
export const Participant = sequelize.define(
  "Participant",
  {},
  { tableName: "conversation_members", timestamps: false },
);
TeamMember.hasMany(Conversation, {
  as: "createdConversations",
  foreignKey: { name: "createdBy", allowNull: false },
});
Conversation.belongsTo(TeamMember, { as: "creator", foreignKey: "createdBy" });
TeamMember.belongsToMany(Conversation, {
  through: Participant,
  foreignKey: "memberId",
  otherKey: "conversationId",
});
Conversation.belongsToMany(TeamMember, {
  through: Participant,
  foreignKey: "conversationId",
  otherKey: "memberId",
});
export const Message = sequelize.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    text: { type: DataTypes.STRING(2000), allowNull: false },
  },
  { tableName: "messages", updatedAt: false },
);
Conversation.hasMany(Message, {
  foreignKey: { name: "conversationId", allowNull: false },
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, { foreignKey: "conversationId" });
TeamMember.hasMany(Message, {
  foreignKey: { name: "memberId", allowNull: false },
});
Message.belongsTo(TeamMember, { foreignKey: "memberId" });
export const Session = sequelize.define(
  "Session",
  {
    tokenHash: { type: DataTypes.STRING(64), primaryKey: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "sessions", timestamps: false },
);
Session.belongsTo(TeamMember, {
  foreignKey: { name: "memberId", allowNull: false },
  onDelete: "CASCADE",
});
