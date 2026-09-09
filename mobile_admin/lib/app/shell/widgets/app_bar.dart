import 'package:flutter/material.dart';

class AdminAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onMenuTap;
  final int notificationCount;
  final VoidCallback? onNotificationTap;

  const AdminAppBar({
    super.key,
    required this.title,
    this.onMenuTap,
    this.notificationCount = 0,
    this.onNotificationTap,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      leading: IconButton(
        icon: const Icon(Icons.menu),
        onPressed: onMenuTap ?? () => Scaffold.of(context).openDrawer(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () {
            // TODO: Implement search
          },
        ),
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: onNotificationTap,
            ),
            if (notificationCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    notificationCount > 9 ? '9+' : notificationCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
