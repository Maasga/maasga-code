import 'package:flutter/material.dart';

class BrandScroll extends StatelessWidget {
  const BrandScroll({
    super.key,
    required this.brandAssetPaths,
  });

  final List<String> brandAssetPaths;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 70,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: brandAssetPaths.length,
        itemBuilder: (context, index) {
          final asset = brandAssetPaths[index];
          return Container(
            margin: const EdgeInsets.only(right: 16),
            constraints: const BoxConstraints(maxWidth: 70),
            child: Image.asset(
              asset,
              height: 30,
              width: 70,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => Container(),
            ),
          );
        },
      ),
    );
  }
}

