import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/widgets/maasga_primary_button.dart';

class PaymentWebViewScreen extends ConsumerStatefulWidget {
  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    required this.orderId,
  });

  final String paymentUrl;
  final int orderId;

  @override
  ConsumerState<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends ConsumerState<PaymentWebViewScreen> {
  late final WebViewController _controller;
  Timer? _pollTimer;
  bool _checking = false;
  String _status = 'Initialisation du paiement...';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final url = request.url.toLowerCase();
            if (url.contains('/espace-client') ||
                url.contains('success') ||
                url.contains('paid')) {
              _checkAndFinish();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _checkAndFinish());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkAndFinish() async {
    if (_checking || !mounted) return;
    _checking = true;
    try {
      final dio = await ref.read(dioProvider.future);
      final response = await dio.get('/api/payment/status/${widget.orderId}');
      final map = response.data as Map<String, dynamic>? ?? const {};
      final isPaid = map['isPaid'] == true;
      if (isPaid && mounted) {
        _pollTimer?.cancel();
        Navigator.of(context).pop(true);
      } else if (mounted) {
        setState(() => _status = 'Paiement en attente de confirmation...');
      }
    } on DioException {
      // Non-blocking polling errors.
    } finally {
      _checking = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paiement sécurisé')),
      body: Column(
        children: [
          Expanded(child: WebViewWidget(controller: _controller)),
          Container(
            width: double.infinity,
            color: const Color(0xFFF6FAFF),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Text(
              _status,
              style: const TextStyle(fontSize: 12, color: Color(0xFF475467)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: MaasgaPrimaryButton(
                    variant: MaasgaButtonVariant.outline,
                    onPressed: () => Navigator.of(context).pop(false),
                    label: 'Fermer',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: MaasgaPrimaryButton(
                    onPressed: _checkAndFinish,
                    label: 'J’ai terminé le paiement',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
