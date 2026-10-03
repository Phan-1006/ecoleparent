import 'package:flutter/material.dart';

void main() {
  runApp(const ParentEcoleApp());
}

class ParentEcoleApp extends StatelessWidget {
  const ParentEcoleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ParentEcole Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4338CA), // Indigo 700
          primary: const Color(0xFF4338CA),
          secondary: const Color(0xFF0284C7),
          surface: const Color(0xFFF8FAFC),
        ),
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF0F172A),
          elevation: 0,
          centerTitle: false,
        ),
      ),
      home: const MainMobileScreen(),
    );
  }
}

class MainMobileScreen extends StatefulWidget {
  const MainMobileScreen({super.key});

  @override
  State<MainMobileScreen> createState() => _MainMobileScreenState();
}

class _MainMobileScreenState extends State<MainMobileScreen> {
  int _currentIndex = 0;
  String _userRole = 'parent'; // 'parent' or 'caissier'
  bool _isChildLinked = true;
  String _activeStudentName = 'David Kasereka';
  String _activeClass = '6ème Primaire A';
  String _activeMatricule = 'PE-HORZ-2026-DK89';
  double _remainingBalance = 180.0;
  double _totalPaid = 420.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF4338CA),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.school, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ParentEcole',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  _userRole == 'parent' ? 'Espace Parent' : 'Caisse Scolaire',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (val) {
              setState(() {
                _userRole = val;
                _currentIndex = 0;
              });
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'parent', child: Text('Basculer vers Espace Parent')),
              const PopupMenuItem(value: 'caissier', child: Text('Basculer vers Espace Caissier')),
            ],
          ),
        ],
      ),
      body: _userRole == 'parent' ? _buildParentBody() : _buildCashierBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) {
          setState(() {
            _currentIndex = idx;
          });
        },
        destinations: _userRole == 'parent'
            ? const [
                NavigationDestination(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  selectedIcon: Icon(Icons.account_balance_wallet),
                  label: 'Finances',
                ),
                NavigationDestination(
                  icon: Icon(Icons.event_available_outlined),
                  selectedIcon: Icon(Icons.event_available),
                  label: 'Présences',
                ),
                NavigationDestination(
                  icon: Icon(Icons.menu_book_outlined),
                  selectedIcon: Icon(Icons.menu_book),
                  label: 'Devoirs',
                ),
                NavigationDestination(
                  icon: Icon(Icons.shield_outlined),
                  selectedIcon: Icon(Icons.shield),
                  label: 'Discipline',
                ),
              ]
            : const [
                NavigationDestination(
                  icon: Icon(Icons.point_of_sale_outlined),
                  selectedIcon: Icon(Icons.point_of_sale),
                  label: 'Paiements',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long),
                  label: 'Journal Caisse',
                ),
              ],
      ),
    );
  }

  Widget _buildParentBody() {
    switch (_currentIndex) {
      case 0:
        return _buildFinanceTab();
      case 1:
        return _buildAttendanceTab();
      case 2:
        return _buildHomeworkTab();
      case 3:
        return _buildConductTab();
      default:
        return _buildFinanceTab();
    }
  }

  Widget _buildFinanceTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Student Profile Card
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            color: const Color(0xFF1E1B4B),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: const Color(0xFF6366F1),
                        radius: 24,
                        child: Text(
                          _activeStudentName.isNotEmpty ? _activeStudentName[0] : 'E',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _activeStudentName,
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$_activeClass • ID: $_activeMatricule',
                              style: const TextStyle(color: Color(0xFFA5B4FC), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatCol('Encaissé', '$_totalPaid \$', Colors.greenAccent),
                        Container(height: 30, width: 1, color: Colors.white24),
                        _buildStatCol('Reste à Payer', '$_remainingBalance \$', Colors.orangeAccent),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Recovery Warning Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: const Color(0xFFFFF1F2),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: const [
                  Icon(Icons.warning_amber_rounded, color: Color(0xFFE11D48)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Échéance 2ème tranche : Renvoi prévu au 30 Octobre pour solde insuffisant.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF881337), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Historique des Versements',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 10),

          _buildPaymentItem('Frais Scolaires T1', '250 \$', '15 Septembre 2026', 'Mobile Money (M-Pesa)'),
          _buildPaymentItem('Acompte Scolarité', '170 \$', '02 Octobre 2026', 'Espèces Caisse'),
        ],
      ),
    );
  }

  Widget _buildStatCol(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildPaymentItem(String title, String amount, String date, String method) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFDCFCE7),
          child: const Icon(Icons.check, color: Color(0xFF16A34A), size: 18),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('$date • $method', style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF16A34A), fontSize: 15)),
      ),
    );
  }

  Widget _buildAttendanceTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('Taux de Présence Global', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('94 %', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4338CA), fontSize: 18)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Derniers Événements d\'Appel', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        _buildAttendanceItem('24 Septembre 2026', 'Présent', Colors.green, Icons.check_circle_outline),
        _buildAttendanceItem('22 Septembre 2026', 'Absence justifiée (Fièvre)', Colors.orange, Icons.error_outline),
        _buildAttendanceItem('20 Septembre 2026', 'Présent', Colors.green, Icons.check_circle_outline),
      ],
    );
  }

  Widget _buildAttendanceItem(String date, String status, Color color, IconData icon) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: color),
        title: Text(date, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        trailing: Text(status, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
      ),
    );
  }

  Widget _buildHomeworkTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Devoirs & Échéances', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        _buildHomeworkCard('Mathématiques', 'Exercices p.45 - Équations du 1er degré', 'Pour le 28 Septembre', const Color(0xFF3B82F6)),
        _buildHomeworkCard('Français', 'Rédaction : Récit d\'une aventure', 'Pour le 30 Septembre', const Color(0xFF8B5CF6)),
      ],
    );
  }

  Widget _buildHomeworkCard(String subject, String desc, String due, Color color) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                  child: Text(subject, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11)),
                ),
                Text(due, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 8),
            Text(desc, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildConductTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Suivi de Discipline & Conduite', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        _buildConductItem('Félicitations', 'Excellente participation au devoir de groupe', 'Prof. Claire', Colors.green),
        _buildConductItem('Observation', 'Retard de 15 minutes le matin', 'Surveillant Paul', Colors.orange),
      ],
    );
  }

  Widget _buildConductItem(String type, String comment, String author, Color color) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.15),
          child: Icon(Icons.shield, color: color, size: 20),
        ),
        title: Text(type, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
        subtitle: Text('$comment\nSignalé par : $author', style: const TextStyle(fontSize: 11, color: Colors.black87)),
        isThreeLine: true,
      ),
    );
  }

  // --------------------------------------------------------------------------
  // CASHIER VIEW WITH REAL-TIME SEARCH BAR
  // --------------------------------------------------------------------------
  String _cashierSearch = '';
  final TextEditingController _amountController = TextEditingController(text: '150');

  final List<Map<String, dynamic>> _mockStudents = [
    {
      'id': 'st-1',
      'name': 'David Kasereka',
      'class': '6ème Primaire A',
      'matricule': 'PE-HORZ-2026-DK89',
      'due': 180.0,
    },
    {
      'id': 'st-2',
      'name': 'Sarah Kasereka',
      'class': '4ème Primaire B',
      'matricule': 'PE-HORZ-2026-SK12',
      'due': 75.0,
    },
    {
      'id': 'st-3',
      'name': 'Emmanuel Lumumba',
      'class': '3ème Secondaire C',
      'matricule': 'PE-HORZ-2026-EL45',
      'due': 250.0,
    },
    {
      'id': 'st-4',
      'name': 'Grâce Masika',
      'class': '1ère Secondaire A',
      'matricule': 'PE-HORZ-2026-GM77',
      'due': 0.0,
    },
  ];

  Map<String, dynamic>? _selectedStudentForPayment;

  Widget _buildCashierBody() {
    final filtered = _mockStudents.where((st) {
      if (_cashierSearch.isEmpty) return true;
      final q = _cashierSearch.toLowerCase();
      final n = (st['name'] as String).toLowerCase();
      final m = (st['matricule'] as String).toLowerCase();
      final c = (st['class'] as String).toLowerCase();
      return n.contains(q) || m.contains(q) || c.contains(q);
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cashier Search Bar (Prominent, High Priority)
          TextField(
            onChanged: (val) {
              setState(() {
                _cashierSearch = val;
              });
            },
            decoration: InputDecoration(
              hintText: 'Rechercher un élève (nom, classe, matricule)...',
              hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF0284C7)),
              suffixIcon: _cashierSearch.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        setState(() {
                          _cashierSearch = '';
                        });
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Search results list if no student selected
          if (_selectedStudentForPayment == null) ...[
            Text(
              '${filtered.length} élève(s) correspondant(s) :',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey),
            ),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              itemBuilder: (ctx, idx) {
                final st = filtered[idx];
                final due = st['due'] as double;
                return Card(
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: ListTile(
                    onTap: () {
                      setState(() {
                        _selectedStudentForPayment = st;
                        _amountController.text = due > 0 ? due.toStringAsFixed(0) : '100';
                      });
                    },
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFFE0F2FE),
                      child: Text(st['name'][0], style: const TextStyle(color: Color(0xFF0369A1), fontWeight: FontWeight.bold)),
                    ),
                    title: Text(st['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text('${st['class']} • ${st['matricule']}', style: const TextStyle(fontSize: 11)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          due > 0 ? '$due \$ dû' : 'En règle',
                          style: TextStyle(
                            color: due > 0 ? Colors.redAccent : Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        const Text('Toucher pour choisir', style: TextStyle(fontSize: 9, color: Colors.grey)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ] else ...[
            // Selected student card with change button
            Card(
              color: const Color(0xFFECFEFF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFA5F3FC))),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF0891B2)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedStudentForPayment!['name'],
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF164E63)),
                          ),
                          Text(
                            '${_selectedStudentForPayment!['class']} • ${_selectedStudentForPayment!['matricule']}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF0E7490)),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _selectedStudentForPayment = null;
                        });
                      },
                      child: const Text('Changer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Payment Form
            Card(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Enregistrement du Versement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 14),

                    TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Montant à Encaisser (\$)',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      value: 'Frais Scolaires',
                      decoration: InputDecoration(
                        labelText: 'Type de frais',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Frais Scolaires', child: Text('Frais Scolaires')),
                        DropdownMenuItem(value: 'Transport Scolaire', child: Text('Transport Scolaire')),
                        DropdownMenuItem(value: 'Cantine', child: Text('Cantine')),
                      ],
                      onChanged: (val) {},
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      value: 'Mobile Money',
                      decoration: InputDecoration(
                        labelText: 'Mode de paiement',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Mobile Money', child: Text('Mobile Money (M-Pesa/Airtel)')),
                        DropdownMenuItem(value: 'Espèces', child: Text('Espèces (Cash Caisse)')),
                        DropdownMenuItem(value: 'Virement', child: Text('Virement Bancaire')),
                      ],
                      onChanged: (val) {},
                    ),
                    const SizedBox(height: 18),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Paiement de ${_amountController.text} \$ enregistré avec succès ! Reçu officiel généré.'),
                              backgroundColor: Colors.green,
                            ),
                          );
                          setState(() {
                            _selectedStudentForPayment = null;
                            _cashierSearch = '';
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0891B2),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: const Icon(Icons.receipt_long),
                        label: const Text('Valider & Générer Reçu', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
