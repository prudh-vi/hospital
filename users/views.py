from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import RegisterSerializer, DoctorSerializer, PatientSerializer
from .models import Doctor, Patient

from .permissions import IsAdmin, IsAdminOrDoctor

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'doctor']:
            return Doctor.objects.select_related('user').all()
        return Doctor.objects.select_related('user').filter(is_available=True)


class PatientListView(generics.ListAPIView):
    queryset = Patient.objects.select_related('user').all()
    serializer_class = PatientSerializer
    permission_classes = [IsAdminOrDoctor]



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "role": request.user.role
    })