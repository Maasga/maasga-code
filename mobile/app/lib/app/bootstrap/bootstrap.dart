import 'package:hive_flutter/hive_flutter.dart';

import '../../core/config/env.dart';

Future<void> bootstrapDependencies() async {
  await Hive.initFlutter();
  await Hive.openBox<String>('session');
}

const String apiBaseUrl = Env.apiBaseUrl;
