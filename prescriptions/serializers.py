from rest_framework import serializers
from .models import Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='appointment.doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='appointment.patient.user.get_full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = ['id', 'appointment', 'diagnosis', 'medicines', 'instructions', 'created_at', 'doctor_name', 'patient_name']