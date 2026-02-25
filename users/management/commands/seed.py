from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import User, Doctor, Patient
from appointments.models import Appointment
from prescriptions.models import Prescription
from billing.models import Invoice


class Command(BaseCommand):
    help = 'Seed database with mock data'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Seeding data...')

        # ── Clean existing data ──────────────────────────
        Invoice.objects.all().delete()
        Prescription.objects.all().delete()
        Appointment.objects.all().delete()
        Doctor.objects.all().delete()
        Patient.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        # ── Create Admin ─────────────────────────────────
        admin = User.objects.create_user(
            username='admin',
            email='admin@hospital.com',
            password='admin123',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        self.stdout.write('✅ Admin created')

        # ── Create Doctors ────────────────────────────────
        doctors_data = [
            dict(username='dr_smith',   email='smith@hospital.com',   first_name='John',    last_name='Smith',   specialization='cardiologist', experience_years=10, consultation_fee=800),
            dict(username='dr_priya',   email='priya@hospital.com',   first_name='Priya',   last_name='Sharma',  specialization='neurologist',  experience_years=8,  consultation_fee=700),
            dict(username='dr_kumar',   email='kumar@hospital.com',   first_name='Raj',     last_name='Kumar',   specialization='orthopedic',   experience_years=15, consultation_fee=600),
            dict(username='dr_mehta',   email='mehta@hospital.com',   first_name='Anjali',  last_name='Mehta',   specialization='general',      experience_years=5,  consultation_fee=400),
        ]

        doctors = []
        for d in doctors_data:
            user = User.objects.create_user(
                username=d['username'], email=d['email'],
                password='doctor123', role='doctor',
                first_name=d['first_name'], last_name=d['last_name']
            )
            doc = Doctor.objects.create(
                user=user,
                specialization=d['specialization'],
                experience_years=d['experience_years'],
                consultation_fee=d['consultation_fee'],
                is_available=True
            )
            doctors.append(doc)
        self.stdout.write('✅ 4 Doctors created')

        # ── Create Patients ───────────────────────────────
        patients_data = [
            dict(username='patient_arjun',  email='arjun@gmail.com',  first_name='Arjun',  last_name='Verma',   dob='1990-05-15', blood='B+',  phone='9876543210', address='Mumbai',   emergency='9876543211'),
            dict(username='patient_sneha',  email='sneha@gmail.com',  first_name='Sneha',  last_name='Reddy',   dob='1995-08-22', blood='O+',  phone='9876543212', address='Delhi',    emergency='9876543213'),
            dict(username='patient_rohit',  email='rohit@gmail.com',  first_name='Rohit',  last_name='Singh',   dob='1988-03-10', blood='A+',  phone='9876543214', address='Bangalore',emergency='9876543215'),
            dict(username='patient_nisha',  email='nisha@gmail.com',  first_name='Nisha',  last_name='Patel',   dob='2000-11-30', blood='AB+', phone='9876543216', address='Chennai',  emergency='9876543217'),
            dict(username='patient_vikram', email='vikram@gmail.com', first_name='Vikram', last_name='Malhotra',dob='1975-07-04', blood='O-',  phone='9876543218', address='Hyderabad',emergency='9876543219'),
        ]

        patients = []
        for p in patients_data:
            user = User.objects.create_user(
                username=p['username'], email=p['email'],
                password='patient123', role='patient',
                first_name=p['first_name'], last_name=p['last_name']
            )
            pat = Patient.objects.create(
                user=user,
                date_of_birth=p['dob'],
                blood_group=p['blood'],
                phone=p['phone'],
                address=p['address'],
                emergency_contact=p['emergency']
            )
            patients.append(pat)
        self.stdout.write('✅ 5 Patients created')

        # ── Create Appointments ───────────────────────────
        now = timezone.now()
        appts_data = [
            dict(doctor=doctors[0], patient=patients[0], days=-2, status='completed', notes='Regular cardiac checkup'),
            dict(doctor=doctors[1], patient=patients[1], days=-1, status='completed', notes='Headache and dizziness'),
            dict(doctor=doctors[2], patient=patients[2], days=1,  status='scheduled', notes='Knee pain follow-up'),
            dict(doctor=doctors[3], patient=patients[3], days=2,  status='scheduled', notes='Fever and cold'),
            dict(doctor=doctors[0], patient=patients[4], days=-3, status='cancelled', notes='Heart palpitations'),
            dict(doctor=doctors[1], patient=patients[0], days=3,  status='scheduled', notes='MRI review'),
            dict(doctor=doctors[3], patient=patients[2], days=-1, status='completed', notes='General checkup'),
        ]

        appointments = []
        for a in appts_data:
            appt = Appointment.objects.create(
                doctor=a['doctor'],
                patient=a['patient'],
                appointment_date=now + timedelta(days=a['days']),
                status=a['status'],
                notes=a['notes']
            )
            appointments.append(appt)
        self.stdout.write('✅ 7 Appointments created')

        # ── Create Prescriptions (only completed appointments) ──
        rx_data = [
            dict(appt=appointments[0], diagnosis='Mild hypertension detected', medicines='Amlodipine 5mg - once daily\nAspirin 75mg - once daily', instructions='Reduce salt intake. Walk 30 mins daily. Follow up in 2 weeks.'),
            dict(appt=appointments[1], diagnosis='Tension headache with mild vertigo', medicines='Ibuprofen 400mg - twice daily after meals\nBetahistine 16mg - twice daily', instructions='Rest adequately. Avoid screen time. Stay hydrated.'),
            dict(appt=appointments[6], diagnosis='Seasonal flu', medicines='Paracetamol 500mg - thrice daily\nCetirizine 10mg - at night', instructions='Drink warm fluids. Rest for 3 days. Come back if fever persists.'),
        ]

        for r in rx_data:
            Prescription.objects.create(
                appointment=r['appt'],
                diagnosis=r['diagnosis'],
                medicines=r['medicines'],
                instructions=r['instructions']
            )
        self.stdout.write('✅ 3 Prescriptions created')

        # ── Create Invoices ───────────────────────────────
        invoice_data = [
            dict(appt=appointments[0], amount=800,  status='paid'),
            dict(appt=appointments[1], amount=700,  status='paid'),
            dict(appt=appointments[4], amount=800,  status='cancelled'),
            dict(appt=appointments[6], amount=400,  status='pending'),
        ]

        for i in invoice_data:
            Invoice.objects.create(
                appointment=i['appt'],
                amount=i['amount'],
                status=i['status'],
                paid_at=now if i['status'] == 'paid' else None
            )
        self.stdout.write('✅ 4 Invoices created')

        # ── Summary ───────────────────────────────────────
        self.stdout.write(self.style.SUCCESS('''
╔══════════════════════════════════════╗
║         MOCK DATA SEEDED! 🎉         ║
╠══════════════════════════════════════╣
║  Admin:    admin / admin123          ║
║  Doctors:  dr_smith / doctor123      ║
║            dr_priya / doctor123      ║
║            dr_kumar / doctor123      ║
║            dr_mehta / doctor123      ║
║  Patients: patient_arjun / patient123║
║            patient_sneha / patient123║
║            patient_rohit / patient123║
║            patient_nisha / patient123║
║            patient_vikram/ patient123║
╚══════════════════════════════════════╝
        '''))