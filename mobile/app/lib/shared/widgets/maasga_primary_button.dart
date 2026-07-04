import 'package:flutter/material.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../design_tokens/maasga_tokens.dart';

enum MaasgaButtonVariant { primary, secondary, outline, danger }

class MaasgaPrimaryButton extends StatelessWidget {
  const MaasgaPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.enabled = true,
    this.variant = MaasgaButtonVariant.primary,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool enabled;
  final MaasgaButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final action = enabled ? () async {
      // Haptic feedback
      if (await Vibration.hasVibrator() == true) {
        Vibration.vibrate(duration: 15, amplitude: 128);
      }
      onPressed?.call();
    } : null;

    final isPrimary = variant == MaasgaButtonVariant.primary;
    final isDanger = variant == MaasgaButtonVariant.danger;
    final isOutline = variant == MaasgaButtonVariant.outline;
    
    final gradient = isPrimary
        ? MaasgaTokens.brandGradient
        : isDanger
            ? const LinearGradient(colors: [Color(0xFFE53935), Color(0xFFB71C1C)])
            : null;
            
    final fg = isOutline ? MaasgaTokens.blue700 : Colors.white;
    
    return Opacity(
      opacity: enabled ? 1 : 0.6,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: gradient,
          color: gradient == null
              ? (variant == MaasgaButtonVariant.secondary ? MaasgaTokens.bgMuted : Colors.white)
              : null,
          border: isOutline ? Border.all(color: MaasgaTokens.blue700, width: 1.4) : null,
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusPill),
        ),
        child: ElevatedButton.icon(
          onPressed: action,
          icon: icon != null ? Icon(icon, size: 18) : const SizedBox.shrink(),
          label: Text(label),
          style: ElevatedButton.styleFrom(
            shadowColor: Colors.transparent,
            backgroundColor: Colors.transparent,
            foregroundColor: fg,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusPill),
            ),
          ),
        )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .scaleXY(begin: 1.0, end: 1.0, duration: 100.ms) // Just to enable the target for interactions
        .animate(target: enabled ? 1 : 0)
        .shimmer(duration: 2.seconds, color: Colors.white.withValues(alpha: 0.1))
        ,
      ),
    ).animate().fadeIn(duration: 400.ms);
  }
}
