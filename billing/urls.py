from django.urls import path
from .views import InvoiceListCreateView

urlpatterns = [
    path('', InvoiceListCreateView.as_view()),
]