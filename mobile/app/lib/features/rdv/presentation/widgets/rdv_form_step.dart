import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:calendar_date_picker2/calendar_date_picker2.dart';
import '../../domain/neighborhoods.dart';

class RdvFormStep extends StatefulWidget {
  final String selectedServiceType;
  final VoidCallback onBack;
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController phoneCtrl;
  final TextEditingController emailCtrl;
  final TextEditingController notesCtrl;
  final String? selectedQuartier;
  final Function(String) onQuartierChanged;
  final LatLng? selectedLocation;
  final Function(LatLng, String?) onLocationChanged;
  final DateTime? selectedDate;
  final Function(DateTime) onDateChanged;
  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final Function(TimeOfDay, bool isStart) onTimeChanged;
  final bool isConsented;
  final String? address;
  final Function(bool?) onConsentChanged;


  const RdvFormStep({
    super.key,
    required this.selectedServiceType,
    required this.onBack,
    required this.formKey,
    required this.nameCtrl,
    required this.phoneCtrl,
    required this.emailCtrl,
    required this.notesCtrl,
    required this.selectedQuartier,
    required this.onQuartierChanged,
    required this.selectedLocation,
    required this.onLocationChanged,
    required this.selectedDate,
    required this.onDateChanged,
    required this.startTime,
    required this.endTime,
    required this.onTimeChanged,
    required this.isConsented,
    required this.address,
    required this.onConsentChanged,
  });

  @override
  State<RdvFormStep> createState() => _RdvFormStepState();
}

class _RdvFormStepState extends State<RdvFormStep> {
  GoogleMapController? _mapController;
  final LatLng _initialPos = const LatLng(12.3647, -1.5335); // Ouagadougou
  Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    if (widget.selectedLocation != null) {
      _markers.add(
        Marker(
          markerId: const MarkerId('selected_pos'),
          position: widget.selectedLocation!,
          draggable: true,
          onDragEnd: (newPos) => _updateLocation(newPos),
        ),
      );
    }
  }

  Future<void> _updateLocation(LatLng pos) async {
    setState(() {
      _markers = {
        Marker(
          markerId: const MarkerId('selected_pos'),
          position: pos,
          draggable: true,
          onDragEnd: (newPos) => _updateLocation(newPos),
        ),
      };
    });
    
    String? address;
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        address = '${p.street}, ${p.subLocality}, ${p.locality}';
      }
    } catch (_) {}
    
    widget.onLocationChanged(pos, address);
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    final position = await Geolocator.getCurrentPosition();
    final latLng = LatLng(position.latitude, position.longitude);
    
    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 15));
    _updateLocation(latLng);
  }

  void _showQuartierPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _QuartierSearchDialog(
        currentSelection: widget.selectedQuartier,
        onSelected: (val) {
          widget.onQuartierChanged(val);
          Navigator.pop(ctx);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B3A8D);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Form(
        key: widget.formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // Recap header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8EEFF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                   const Icon(Icons.info_outline, color: primaryBlue, size: 20),
                   const SizedBox(width: 10),
                   Expanded(
                     child: Text(
                       widget.selectedServiceType,
                       style: GoogleFonts.poppins(
                         fontSize: 14,
                         fontWeight: FontWeight.w600,
                         color: primaryBlue,
                       ),
                     ),
                   ),
                   TextButton(
                     onPressed: widget.onBack,
                     child: Text(
                       'Modifier',
                       style: GoogleFonts.poppins(
                         fontSize: 13,
                         fontWeight: FontWeight.w600,
                         color: primaryBlue,
                       ),
                     ),
                   ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            _buildLabel('Nom complet *'),
            TextFormField(
              controller: widget.nameCtrl,
              decoration: _buildInputDecoration('Votre nom et prénom', Icons.person_outline),
              validator: (v) => v == null || v.isEmpty ? 'Champ obligatoire' : null,
              style: GoogleFonts.poppins(fontSize: 14),
            ),
            const SizedBox(height: 16),

            _buildLabel('Téléphone (WhatsApp) *'),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F5F5),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      bottomLeft: Radius.circular(12),
                    ),
                    border: Border.all(color: const Color(0xFFD8EAFB)),
                  ),
                  child: Text(
                    '+226',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
                Expanded(
                  child: TextFormField(
                    controller: widget.phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: _buildInputDecoration(
                      'XX XX XX XX', 
                      Icons.phone,
                      radius: const BorderRadius.only(
                        topRight: Radius.circular(12),
                        bottomRight: Radius.circular(12),
                      ),
                    ),
                    validator: (v) => v == null || v.length < 8 ? '8 chiffres minimum' : null,
                    style: GoogleFonts.poppins(fontSize: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            _buildLabel('Email (optionnel)'),
            TextFormField(
              controller: widget.emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: _buildInputDecoration('votre@email.com', Icons.email_outlined),
              style: GoogleFonts.poppins(fontSize: 14),
            ),
            const SizedBox(height: 16),

            _buildLabel('Quartier / Secteur *'),
            InkWell(
              onTap: _showQuartierPicker,
              child: IgnorePointer(
                child: TextFormField(
                  controller: TextEditingController(text: widget.selectedQuartier),
                  decoration: _buildInputDecoration('Sélectionner votre quartier', Icons.location_city_outlined).copyWith(
                    suffixIcon: const Icon(Icons.arrow_drop_down),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Veuillez choisir un quartier' : null,
                  style: GoogleFonts.poppins(fontSize: 14),
                ),
              ),
            ),
            const SizedBox(height: 16),

            _buildLabel('Localisation précise'),
            Container(
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFD8EAFB)),
              ),
              clipBehavior: Clip.antiAlias,
              child: kIsWeb 
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'La carte interactive n\'est pas disponible en version Web. Veuillez indiquer votre adresse précise ci-dessous.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                  )
                : GoogleMap(
                    initialCameraPosition: CameraPosition(target: _initialPos, zoom: 12),
                    onMapCreated: (c) => _mapController = c,
                    onTap: _updateLocation,
                    markers: _markers,
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
                    zoomControlsEnabled: false,
                  ),
            ),
            Row(
              children: [
                const Icon(Icons.my_location, color: primaryBlue, size: 18),
                TextButton(
                  onPressed: _getCurrentLocation,
                  child: Text(
                    'Me localiser automatiquement',
                    style: GoogleFonts.poppins(
                      color: primaryBlue,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            if (widget.selectedLocation != null)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F4FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: primaryBlue, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.address ?? 'Position sélectionnée',
                        style: GoogleFonts.poppins(fontSize: 12, color: primaryBlue),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 24),

            _buildLabel('Date souhaitée *'),
            InkWell(
              onTap: () async {
                final today = DateTime.now();
                final first = DateTime(today.year, today.month, today.day);
                final initial = first.add(const Duration(days: 1));
                
                final results = await showCalendarDatePicker2Dialog(
                  context: context,
                  config: CalendarDatePicker2WithActionButtonsConfig(
                    calendarType: CalendarDatePicker2Type.single,
                    selectedDayHighlightColor: primaryBlue,
                    weekdayLabelTextStyle: GoogleFonts.poppins(
                      color: Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                    controlsTextStyle: GoogleFonts.poppins(
                      color: Colors.black,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    dayTextStyle: GoogleFonts.poppins(color: Colors.black),
                    disabledDayTextStyle: const TextStyle(color: Colors.grey),
                    firstDate: first,
                    lastDate: first.add(const Duration(days: 90)),
                    currentDate: today,
                    cancelButton: Text(
                      'Annuler',
                      style: GoogleFonts.poppins(color: primaryBlue, fontWeight: FontWeight.w600),
                    ),
                    okButton: Text(
                      'Valider',
                      style: GoogleFonts.poppins(color: primaryBlue, fontWeight: FontWeight.w600),
                    ),
                  ),
                  dialogSize: const Size(325, 400),
                  borderRadius: BorderRadius.circular(15),
                  value: [widget.selectedDate ?? initial],
                );

                if (results != null && results.isNotEmpty && results[0] != null) {
                  widget.onDateChanged(results[0]!);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFD8EAFB)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, color: Color(0xFF757575), size: 20),
                    const SizedBox(width: 12),
                    Text(
                      widget.selectedDate == null 
                          ? 'Sélectionner une date' 
                          : DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(widget.selectedDate!),
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: widget.selectedDate == null ? const Color(0xFF9E9E9E) : const Color(0xFF1A1A1A),
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.arrow_drop_down, color: Color(0xFF757575)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            _buildLabel('Horaire souhaité'),
            Text(
              "Choisissez l'intervalle de disponibilité",
              style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF9E9E9E)),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _buildTimePicker(true)),
                const SizedBox(width: 12),
                Expanded(child: _buildTimePicker(false)),
              ],
            ),
            const SizedBox(height: 24),

            _buildLabel('Informations complémentaires (optionnel)'),
            TextFormField(
              controller: widget.notesCtrl,
              maxLines: 4,
              maxLength: 500,
              decoration: _buildInputDecoration('Décrivez votre projet ou problème...', null),
              style: GoogleFonts.poppins(fontSize: 14),
            ),

            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: widget.isConsented,
                   onChanged: widget.onConsentChanged,
                    activeColor: primaryBlue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "J'accepte d'être contacté(e) par MAASGA concernant ma demande. Mes données sont utilisées uniquement pour le suivi de ma demande.",
                    style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: const Color(0xFF1A1A1A),
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String hint, IconData? icon, {BorderRadius? radius}) {
    final borderRadius = radius ?? BorderRadius.circular(12);
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: const Color(0xFF9E9E9E), fontSize: 13),
      prefixIcon: icon != null ? Icon(icon, color: const Color(0xFF757575), size: 20) : null,
      filled: true,
      fillColor: Colors.white,
      enabledBorder: OutlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: Color(0xFFD8EAFB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: Color(0xFF1B3A8D), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: Colors.red, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: Colors.red, width: 1.5),
      ),
    );
  }

  Widget _buildTimePicker(bool isStart) {
    final time = isStart ? widget.startTime : widget.endTime;
    return InkWell(
      onTap: () async {
        final picked = await showTimePicker(
          context: context,
          initialTime: time ?? (isStart ? const TimeOfDay(hour: 8, minute: 0) : const TimeOfDay(hour: 17, minute: 0)),
        );
        if (picked != null) widget.onTimeChanged(picked, isStart);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFD8EAFB)),
        ),
        child: Row(
          children: [
            const Icon(Icons.access_time_outlined, color: Color(0xFF757575), size: 20),
            const SizedBox(width: 8),
            Text(
              time == null ? (isStart ? 'Début' : 'Fin') : time.format(context),
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: time == null ? const Color(0xFF9E9E9E) : const Color(0xFF1A1A1A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuartierSearchDialog extends StatefulWidget {
  final String? currentSelection;
  final Function(String) onSelected;

  const _QuartierSearchDialog({required this.currentSelection, required this.onSelected});

  @override
  State<_QuartierSearchDialog> createState() => _QuartierSearchDialogState();
}

class _QuartierSearchDialogState extends State<_QuartierSearchDialog> {
  String _search = '';
  
  @override
  Widget build(BuildContext context) {
    final filtered = ouagaNeighborhoods
        .where((q) => q.toLowerCase().contains(_search.toLowerCase()))
        .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          Text('Sélectionner votre quartier', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Rechercher un quartier...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: const Color(0xFFF5F5F5),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final q = filtered[index];
                final isSelected = q == widget.currentSelection;
                return ListTile(
                  title: Text(q, style: GoogleFonts.poppins(fontSize: 14, color: isSelected ? const Color(0xFF1B3A8D) : Colors.black87, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400)),
                  trailing: isSelected ? const Icon(Icons.check, color: Color(0xFF1B3A8D)) : null,
                  onTap: () => widget.onSelected(q),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
