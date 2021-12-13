from django.conf.urls import url
from .views import *

urlpatterns = [
    url('^page-data', view=order_page_data),
    url(r'^public-page-data/(?P<week_number>\d+)', view=public_order_page_data),
    url(r'^save/(?P<order_id>\d+|new)', view=save_order),
    url(r'^delete/(?P<order_id>\d+)', view=delete_order),
    url(r'^public/', view=public_order_list),
    url(r'^week-select-data', view=get_weeks_select_data),
    url('', view=order_list),
]
