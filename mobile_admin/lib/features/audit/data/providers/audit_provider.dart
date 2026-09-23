import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/audit_repository.dart';
import '../models/audit_log.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final auditRepositoryProvider = Provider<AuditRepository>((ref) {
  return AuditRepository(ref.watch(dioProvider));
});

// Audit logs provider
final auditLogsProvider = FutureProvider<List<AuditLog>>((ref) async {
  final repository = ref.watch(auditRepositoryProvider);
  return repository.getAuditLogs();
});