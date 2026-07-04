import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../data/home_repository.dart';
import '../models/promo.dart';

class PromoBanner extends ConsumerStatefulWidget {
  const PromoBanner({super.key});

  @override
  ConsumerState<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends ConsumerState<PromoBanner> {
  final int _dotColor = 0xFFD0D0D0;
  final int _primaryBlue = 0xFF1B3A8D;
  int _activeIndex = 0;

  @override
  Widget build(BuildContext context) {
    final bannersAsync = ref.watch(bannersProvider);

    return bannersAsync.when(
      data: (banners) {
        if (banners.isEmpty) {
          return _buildStaticCarousel();
        }
        return _buildDynamicCarousel(banners);
      },
      loading: () => _buildLoadingState(),
      error: (err, stack) => _buildStaticCarousel(), // Fallback on error
    );
  }

  Widget _buildLoadingState() {
    return Container(
      height: 160,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildStaticCarousel() {
    final List<_Promo> staticPromos = const [
      _Promo(
        title: 'Soldes de fin d\u2019\u00e9t\u00e9',
        subtitle: '- \u00c9conomisez jusqu\u2019\u00e0 30%',
        imageUrl: 'https://images.unsplash.com/photo-1542013976693-85499f1c7964?q=80&w=600&auto=format&fit=crop',
      ),
    ];
    return _buildCarousel(
      items: staticPromos.map((p) => _renderPromoItem(p.title, p.subtitle, p.imageUrl)).toList(),
      count: staticPromos.length,
    );
  }

  Widget _buildDynamicCarousel(List<Promo> banners) {
    return _buildCarousel(
      items: banners.map((p) => _renderPromoItem(p.title, p.subtitle ?? '', p.imageUrl)).toList(),
      count: banners.length,
    );
  }

  Widget _buildCarousel({required List<Widget> items, required int count}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: CarouselSlider(
            items: items,
            options: CarouselOptions(
              height: 160,
              autoPlay: true,
              autoPlayInterval: const Duration(seconds: 4),
              autoPlayCurve: Curves.easeInOut,
              enlargeCenterPage: false,
              viewportFraction: 1.0,
              onPageChanged: (index, _) {
                setState(() => _activeIndex = index);
              },
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: AnimatedSmoothIndicator(
            activeIndex: _activeIndex,
            count: count,
            effect: WormEffect(
              dotHeight: 7,
              dotWidth: 7,
              spacing: 8,
              dotColor: Color(_dotColor),
              activeDotColor: Color(_primaryBlue),
            ),
          ),
        ),
      ],
    );
  }

  Widget _renderPromoItem(String title, String subtitle, String imageUrl) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Image.asset(
                'assets/products/carousel_bg.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [
                    Colors.transparent,
                    Colors.transparent,
                    const Color(0xFF1B3A8D).withValues(alpha: 0.7),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            top: 20,
            bottom: 20,
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                if (subtitle.isNotEmpty)
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 34,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B3A8D),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 0,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: Text(
                      'Découvrir',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
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

class _Promo {
  const _Promo({
    required this.title,
    required this.subtitle,
    required this.imageUrl,
  });

  final String title;
  final String subtitle;
  final String imageUrl;
}
