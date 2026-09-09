class DashboardData {
  final int pendingRdv;
  final int confirmedRdv;
  final int doneRdv;
  final int lowStock;
  final int outOfStock;
  final int pendingReviews;
  final int approvedReviews;
  final double avgNote;
  final double estimatedCA;
  final int rdvThisWeek;
  final int ordersThisWeek;
  final List<DailyCount> rdvChartData;
  final List<Alert> alerts;

  DashboardData({
    required this.pendingRdv,
    required this.confirmedRdv,
    required this.doneRdv,
    required this.lowStock,
    required this.outOfStock,
    required this.pendingReviews,
    required this.approvedReviews,
    required this.avgNote,
    required this.estimatedCA,
    required this.rdvThisWeek,
    required this.ordersThisWeek,
    required this.rdvChartData,
    required this.alerts,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      pendingRdv: json['pendingRdv'] as int? ?? 0,
      confirmedRdv: json['confirmedRdv'] as int? ?? 0,
      doneRdv: json['doneRdv'] as int? ?? 0,
      lowStock: json['lowStock'] as int? ?? 0,
      outOfStock: json['outOfStock'] as int? ?? 0,
      pendingReviews: json['pendingReviews'] as int? ?? 0,
      approvedReviews: json['approvedReviews'] as int? ?? 0,
      avgNote: (json['avgNote'] as num?)?.toDouble() ?? 0.0,
      estimatedCA: (json['estimatedCA'] as num?)?.toDouble() ?? 0.0,
      rdvThisWeek: json['rdvThisWeek'] as int? ?? 0,
      ordersThisWeek: json['ordersThisWeek'] as int? ?? 0,
      rdvChartData: (json['rdvChartData'] as List?)
              ?.map((e) => DailyCount.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      alerts: (json['alerts'] as List?)
              ?.map((e) => Alert.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class DailyCount {
  final String day;
  final int count;

  DailyCount({required this.day, required this.count});

  factory DailyCount.fromJson(Map<String, dynamic> json) {
    return DailyCount(
      day: json['day'] as String,
      count: json['count'] as int,
    );
  }
}

class Alert {
  final String type;
  final String message;
  final int count;
  final String? route;

  Alert({
    required this.type,
    required this.message,
    required this.count,
    this.route,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      type: json['type'] as String,
      message: json['message'] as String,
      count: json['count'] as int,
      route: json['route'] as String?,
    );
  }
}
