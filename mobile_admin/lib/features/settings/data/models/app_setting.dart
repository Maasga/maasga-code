class AppSetting {
  final String key;
  final String label;
  final String value;
  final String? description;
  final SettingType type;
  final List<String>? options;

  AppSetting({
    required this.key,
    required this.label,
    required this.value,
    this.description,
    this.type = SettingType.text,
    this.options,
  });

  factory AppSetting.fromJson(Map<String, dynamic> json) {
    return AppSetting(
      key: json['key'] ?? '',
      label: json['label'] ?? json['key'] ?? '',
      value: json['value']?.toString() ?? '',
      description: json['description']?.toString(),
      type: _parseType(json['type']?.toString()),
      options: json['options'] != null
          ? List<String>.from(json['options'])
          : null,
    );
  }

  static SettingType _parseType(String? type) {
    switch (type?.toLowerCase()) {
      case 'boolean':
        return SettingType.boolean;
      case 'number':
        return SettingType.number;
      case 'select':
        return SettingType.select;
      case 'email':
        return SettingType.email;
      case 'url':
        return SettingType.url;
      default:
        return SettingType.text;
    }
  }

  String get displayValue {
    if (type == SettingType.boolean) {
      return value == 'true' || value == '1' ? 'Activé' : 'Désactivé';
    }
    return value;
  }
}

enum SettingType {
  text,
  number,
  boolean,
  select,
  email,
  url,
}