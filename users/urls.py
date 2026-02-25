from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, DoctorListView, PatientListView

from .views import RegisterView, DoctorListView, PatientListView, me

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('doctors/', DoctorListView.as_view()),
    path('patients/', PatientListView.as_view()),
    path('me/', me),   # ← add this
]