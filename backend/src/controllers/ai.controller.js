const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { adapter } = require('../services/ai.service');
const AIRepo = require('../repositories/ai.repository');
const { chatSchema, studyPlanSchema } = require('../validators/ai.validator');
const prisma = require('../config/db');

async function chat(req, res){
  const body = chatSchema.parse(req.body);
  const conversationId = body.conversation_id || uuidv4();
  // load last 10 messages
  const history = await AIRepo.getLastMessages(conversationId, 10);
  // build messages array
  const system = { role: 'system', content: 'You are SYNC AI assistant: concise, helpful, provide study guidance, cite resources.' };
  const msgs = [system];
  const ordered = history.slice().reverse();
  for(const m of ordered){ msgs.push({ role: m.role === 'ASSISTANT' ? 'assistant' : 'user', content: m.content }); }
  msgs.push({ role: 'user', content: body.message });

  const aiRes = await adapter.chat(msgs);
  // save user message and assistant response
  await AIRepo.saveMessage(req.user.id, conversationId, 'USER', body.message);
  await AIRepo.saveMessage(req.user.id, conversationId, 'ASSISTANT', aiRes.text);
  return res.json(ApiResponse.success({ conversation_id: conversationId, response: aiRes.text }, 'AI response'));
}

async function studyPlan(req, res){
  const payload = studyPlanSchema.parse(req.body);
  // build context: user assignments and attendance summary
  const assignments = await prisma.assignment.findMany({ where: { user_id: req.user.id }, take: 50 });
  const attendance = await prisma.attendanceRecord.findMany({ where: { user_id: req.user.id }, take: 200 });
  const context = { user: { id: req.user.id }, subjects: payload.subjects, exam_date: payload.exam_date, hours_per_day: payload.hours_per_day, assignments, attendance };
  const plan = await adapter.generateStudyPlan(context);
  return res.json(ApiResponse.success(plan, 'Study plan'));
}

async function history(req, res){
  const conv = await AIRepo.getConversationsForUser(req.user.id);
  return res.json(ApiResponse.success(conv, 'Conversations'));
}

async function historyById(req, res){
  const messages = await AIRepo.getMessagesByConversation(req.params.conversationId);
  // ensure ownership
  if(messages.length && messages[0].user_id !== req.user.id) return res.status(403).json(ApiResponse.error('Unauthorized',403));
  return res.json(ApiResponse.success(messages, 'Messages'));
}

async function deleteHistory(req, res){
  // ensure ownership by checking first message
  const messages = await AIRepo.getMessagesByConversation(req.params.conversationId);
  if(messages.length && messages[0].user_id !== req.user.id) return res.status(403).json(ApiResponse.error('Unauthorized',403));
  await AIRepo.deleteConversation(req.params.conversationId);
  return res.json(ApiResponse.success(null, 'Conversation deleted'));
}

module.exports = { chat: asyncHandler(chat), studyPlan: asyncHandler(studyPlan), history: asyncHandler(history), historyById: asyncHandler(historyById), deleteHistory: asyncHandler(deleteHistory) };
