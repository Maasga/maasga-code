import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/message_repository.dart';
import '../models/message.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return MessageRepository(ref.watch(dioProvider));
});

// Messages list provider
final messagesProvider = FutureProvider.autoDispose<List<ClientMessage>>((ref) async {
  final repository = ref.watch(messageRepositoryProvider);
  return repository.getMessages();
});

// Message detail provider
final messageDetailProvider = FutureProvider.autoDispose.family<ClientMessage, int>((ref, id) async {
  final repository = ref.watch(messageRepositoryProvider);
  return repository.getMessageById(id);
});

// Messages stats provider
final messagesStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(messageRepositoryProvider);
  return repository.getMessagesStats();
});

// Respond to message provider
final respondToMessageProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.respondToMessage(data['id'] as int, data['response'] as String);
  // Invalidate messages provider to refresh the list
  ref.invalidate(messagesProvider);
  ref.invalidate(messagesStatsProvider);
  return result;
});

// Update message status provider
final updateMessageStatusProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.updateMessageStatus(data['id'] as int, data['status'] as String);
  // Invalidate messages provider to refresh the list
  ref.invalidate(messagesProvider);
  ref.invalidate(messagesStatsProvider);
  return result;
});

// Delete message provider
final deleteMessageProvider = FutureProvider.autoDispose.family<bool, int>((ref, id) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.deleteMessage(id);
  // Invalidate messages provider to refresh the list
  ref.invalidate(messagesProvider);
  ref.invalidate(messagesStatsProvider);
  return result;
});