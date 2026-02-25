from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Prescription
from .serializers import PrescriptionSerializer

class PrescriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Prescription.objects.all()
        elif user.role == 'doctor':
            return Prescription.objects.filter(appointment__doctor__user=user)
        elif user.role == 'patient':
            return Prescription.objects.filter(appointment__patient__user=user)
        return Prescription.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'doctor']:
            raise PermissionDenied("Only doctors can write prescriptions.")
        
        appointment = serializer.validated_data.get('appointment')
        
        # Ensure the doctor is writing a prescription for their own appointment
        if user.role == 'doctor' and appointment.doctor.user != user:
            raise PermissionDenied("You can only write prescriptions for your own appointments.")
            
        # Check if prescription already exists
        if hasattr(appointment, 'prescription'):
            raise ValidationError("A prescription already exists for this appointment.")
            
        serializer.save()