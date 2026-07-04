import 'package:flutter/material.dart';

class RdvRequest {
  final String serviceType;
  final String fullName;
  final String phone;
  final String? email;
  final String quartier;
  final double? lat;
  final double? lng;
  final String? address;
  final DateTime date;
  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final String? notes;
  final bool consented;

  RdvRequest({
    required this.serviceType,
    required this.fullName,
    required this.phone,
    this.email,
    required this.quartier,
    this.lat,
    this.lng,
    this.address,
    required this.date,
    this.startTime,
    this.endTime,
    this.notes,
    required this.consented,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': serviceType,
      'name': fullName,
      'phone': phone,
      'email': email,
      'quartier': quartier,
      'lat': lat,
      'lng': lng,
      'address': address,
      'date': date.toIso8601String().split('T')[0], // YYYY-MM-DD
      'start_time': startTime != null ? '${startTime!.hour.toString().padLeft(2, '0')}:${startTime!.minute.toString().padLeft(2, '0')}' : null,
      'end_time': endTime != null ? '${endTime!.hour.toString().padLeft(2, '0')}:${endTime!.minute.toString().padLeft(2, '0')}' : null,
      'notes': notes,
      'consented': consented,
    };
  }
}
