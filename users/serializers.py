from rest_framework import serializers
from .models import User, Doctor, Patient

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # never returned in response

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)  # hashes password automatically
        return user


class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'username', 'email', 'specialization', 'experience_years', 'consultation_fee', 'is_available']


class PatientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'username', 'email', 'date_of_birth', 'blood_group', 'phone', 'address', 'emergency_contact']