import 'package:flutter/material.dart';

void main() {
  runApp(const MaasGaAdminApp());
}

class MaasGaAdminApp extends StatelessWidget {
  const MaasGaAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'MaasGa Admin',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(child: Text('MaasGa Admin - Setup en cours')),
      ),
    );
  }
}
