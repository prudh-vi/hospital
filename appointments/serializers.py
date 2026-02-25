from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'patient', 'doctor_name', 'patient_name', 'appointment_date', 'status', 'notes']
        extra_kwargs = {
            'patient': {'required': False, 'allow_null': True}
        }