from rest_framework import generics, permissions
from .models import Appointment
from .serializers import AppointmentSerializer
from users.permissions import IsAdmin, IsAdminOrDoctor
from rest_framework.permissions import IsAuthenticated

class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'admin':
            return Appointment.objects.all().select_related('doctor__user', 'patient__user')

        elif user.role == 'doctor':
            return Appointment.objects.filter(
                doctor__user=user
            ).select_related('doctor__user', 'patient__user')

        elif user.role == 'patient':
            return Appointment.objects.filter(
                patient__user=user
            ).select_related('doctor__user', 'patient__user')

        return Appointment.objects.none()  # fallback — return nothing

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'patient':
            # Automatically assign the patient profile of the logged-in user
            serializer.save(patient=user.patient_profile)
        elif user.role == 'admin':
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only patients or admins can book appointments.")


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Appointment.objects.all()
        elif user.role == 'doctor':
            return Appointment.objects.filter(doctor__user=user)
        elif user.role == 'patient':
            return Appointment.objects.filter(patient__user=user)
        return Appointment.objects.none()