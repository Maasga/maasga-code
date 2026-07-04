import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:introduction_screen/introduction_screen.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const pageDecoration = PageDecoration(
      titleTextStyle: TextStyle(fontSize: 26.0, fontWeight: FontWeight.w800),
      bodyTextStyle: TextStyle(fontSize: 16.0, color: Color(0xFF757575)),
      bodyPadding: EdgeInsets.fromLTRB(16.0, 0.0, 16.0, 16.0),
      pageColor: Colors.white,
      imagePadding: EdgeInsets.zero,
    );

    return IntroductionScreen(
      globalBackgroundColor: Colors.white,
      pages: [
        PageViewModel(
          title: "La Plus Grosse Base de Données",
          body: "L'accès exclusif au catalogue le plus complet du Burkina Faso. Toutes les marques et spécifications techniques à portée de main.",
          image: _buildImage('assets/logo_maasga.png'),
          decoration: pageDecoration,
        ),
        PageViewModel(
          title: "Simulateur Intelligent",
          body: "Calculez précisément vos besoins en BTU pour un confort optimal et des économies d'énergie garanties.",
          image: _buildIcon(Icons.calculate_outlined),
          decoration: pageDecoration,
        ),
        PageViewModel(
          title: "Expertise MAASGA",
          body: "Bénéficiez d'un accompagnement complet : de la sélection rigoureuse à l'installation professionnelle.",
          image: _buildIcon(Icons.verified_user_outlined),
          decoration: pageDecoration,
          footer: Padding(
            padding: const EdgeInsets.only(top: 16),
            child: ElevatedButton(
              onPressed: () => context.go('/auth/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1B3A8D),
                minimumSize: const Size(200, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'C\'est parti !',
                style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ),
      ],
      onDone: () => context.go('/auth/login'),
      onSkip: () => context.go('/auth/login'),
      showSkipButton: true,
      skip: Text('Passer', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1B3A8D))),
      next: const Icon(Icons.arrow_forward, color: Color(0xFF1B3A8D)),
      done: Text('Terminer', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF1B3A8D))),
      curve: Curves.fastLinearToSlowEaseIn,
      dotsDecorator: const DotsDecorator(
        size: Size(10.0, 10.0),
        color: Color(0xFFE0E0E0),
        activeSize: Size(22.0, 10.0),
        activeColor: Color(0xFF1B3A8D),
        activeShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(25.0)),
        ),
      ),
    );
  }

  Widget _buildImage(String assetName) {
    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 40),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFF8F9FF),
          shape: BoxShape.circle,
        ),
        child: Image.asset(assetName, width: 140),
      ),
    );
  }

  Widget _buildIcon(IconData icon) {
    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 40),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: const Color(0xFFF8F9FF),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 80, color: const Color(0xFF1B3A8D)),
      ),
    );
  }
}
