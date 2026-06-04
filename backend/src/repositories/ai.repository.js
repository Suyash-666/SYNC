const prisma = require('../config/db');

async function saveMessage(userId, conversationId, role, content){
  return prisma.aIHistory.create({ data: { user_id: userId, conversation_id: conversationId, role, content } });
}

async function getLastMessages(conversationId, limit = 10){
  return prisma.aIHistory.findMany({ where: { conversation_id: conversationId }, orderBy: { created_at: 'desc' }, take: limit });
}

async function getConversationsForUser(userId){
  const rows = await prisma.aIHistory.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, select: { conversation_id: true, content: true, created_at: true } });
  const map = new Map();
  for(const r of rows){ if(!map.has(r.conversation_id)) map.set(r.conversation_id, r); }
  return Array.from(map.values()).map(r=> ({ conversation_id: r.conversation_id, preview: r.content, created_at: r.created_at }));
}

async function getMessagesByConversation(conversationId){
  return prisma.aIHistory.findMany({ where: { conversation_id: conversationId }, orderBy: { created_at: 'asc' } });
}

async function deleteConversation(conversationId){
  return prisma.aIHistory.deleteMany({ where: { conversation_id: conversationId } });
}

module.exports = { saveMessage, getLastMessages, getConversationsForUser, getMessagesByConversation, deleteConversation };
