from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='appointment.doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='appointment.patient.user.get_full_name', read_only=True)
    appointment_date = serializers.DateTimeField(source='appointment.appointment_date', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'appointment', 'amount', 'status', 'issued_at', 'paid_at', 'doctor_name', 'patient_name', 'appointment_date']