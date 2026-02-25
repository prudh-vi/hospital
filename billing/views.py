from rest_framework import generics, permissions
from .models import Invoice
from .serializers import InvoiceSerializer
from rest_framework.permissions import IsAuthenticated

class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Invoice.objects.all()
        elif user.role == 'doctor':
            return Invoice.objects.filter(appointment__doctor__user=user)
        elif user.role == 'patient':
            return Invoice.objects.filter(appointment__patient__user=user)
        return Invoice.objects.none()

    def perform_create(self, serializer):
        # only admin can create invoices
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can create invoices.")
        serializer.save()