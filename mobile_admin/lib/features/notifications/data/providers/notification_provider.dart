import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/notification_repository.dart';
import '../models/notification.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(dioProvider));
});

// Notifications list provider
final notificationsProvider = FutureProvider.autoDispose<List<NotificationCampaign>>((ref) async {
  final repository = ref.watch(notificationRepositoryProvider);
  return repository.getNotifications();
});

// Notification detail provider
final notificationDetailProvider = FutureProvider.autoDispose.family<NotificationCampaign, int>((ref, id) async {
  final repository = ref.watch(notificationRepositoryProvider);
  return repository.getNotificationById(id);
});

// Notifications stats provider
final notificationsStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(notificationRepositoryProvider);
  return repository.getNotificationsStats();
});

// Create notification provider
final createNotificationProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(notificationRepositoryProvider);
  final result = await repository.createNotification(data);
  // Invalidate notifications provider to refresh the list
  ref.invalidate(notificationsProvider);
  ref.invalidate(notificationsStatsProvider);
  return result;
});

// Send notification provider
final sendNotificationProvider = FutureProvider.autoDispose.family<bool, int>((ref, id) async {
  final repository = ref.watch(notificationRepositoryProvider);
  final result = await repository.sendNotification(id);
  // Invalidate notifications provider to refresh the list
  ref.invalidate(notificationsProvider);
  ref.invalidate(notificationsStatsProvider);
  return result;
});

// Update notification status provider
final updateNotificationStatusProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(notificationRepositoryProvider);
  final result = await repository.updateNotificationStatus(data['id'] as int, data['status'] as String);
  // Invalidate notifications provider to refresh the list
  ref.invalidate(notificationsProvider);
  ref.invalidate(notificationsStatsProvider);
  return result;
});

// Delete notification provider
final deleteNotificationProvider = FutureProvider.autoDispose.family<bool, int>((ref, id) async {
  final repository = ref.watch(notificationRepositoryProvider);
  final result = await repository.deleteNotification(id);
  // Invalidate notifications provider to refresh the list
  ref.invalidate(notificationsProvider);
  ref.invalidate(notificationsStatsProvider);
  return result;
});