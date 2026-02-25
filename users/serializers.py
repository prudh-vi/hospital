from rest_framework import serializers
from .models import User, Doctor, Patient

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # never returned in response

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.get('role', 'patient')
        user = User.objects.create_user(**validated_data)
        
        if role == 'doctor':
            Doctor.objects.create(user=user, consultation_fee=0) # Default fee, should be updated by admin
        elif role == 'patient':
            # Patient needs more info traditionally, but we'll create with defaults or placeholders
            # and let them update it. For now, DOB is required in models.
            from datetime import date
            Patient.objects.create(user=user, date_of_birth=date(1990, 1, 1))
            
        return user


class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'username', 'full_name', 'email', 'specialization', 'experience_years', 'consultation_fee', 'is_available']


class PatientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'username', 'email', 'date_of_birth', 'blood_group', 'phone', 'address', 'emergency_contact']