from django.urls import path
from .views import PrescriptionListCreateView

urlpatterns = [
    path('', PrescriptionListCreateView.as_view()),
]