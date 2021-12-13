import json
import math
import calendar
from datetime import date, timedelta
from datetime import datetime
from django.shortcuts import render
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db.models.functions import TruncDay
from django.db.models import Sum
from .models import *
from .serializers import *

_per_page = 10


@login_required(login_url='/admin/login', redirect_field_name='/order/')
def order_list(request):
    return render(request, 'orders/orders.html')


def public_order_list(request):
    record_count = Order.objects.count()
    page_count = math.ceil(record_count / _per_page)
    pages = range(1, page_count + 1)

    return render(request, 'orders/public-orders.html')


@login_required(login_url='/admin/login', redirect_field_name='/order/')
def order_page_data(request):
    page = request.GET.get('page')
    orders = Order.objects.order_by('-created_at')
    paginator = Paginator(orders, _per_page)

    order_page = paginator.get_page(page)
    order_serializer = OrderSerializer(order_page, many=True)
    clients = Client.objects.order_by('name')
    client_serializer = ClientSerializer(clients, many=True)

    record_count = Order.objects.count()
    page_count = math.ceil(record_count / _per_page)
    pages = [p for p in range(1, page_count + 1)]

    return JsonResponse({
        'orders': order_serializer.data,
        'clients': client_serializer.data,
        'pages': pages
    })


def _get_week_by_number(week_number):
    week_number = int(week_number)
    today_date = date.today()
    first_day_today_month = today_date.replace(day=1)
    last_day_today_month = calendar.monthrange(today_date.year, today_date.month)[1]
    start_date = ''
    end_date = ''

    if week_number == 1:
        start_date = first_day_today_month
        end_date = first_day_today_month + timedelta(days=6)

    elif week_number == 2:
        start_date = first_day_today_month + timedelta(days=7)
        end_date = start_date + timedelta(days=6)

    elif week_number == 3:
        start_date = first_day_today_month + timedelta(days=14)
        end_date = start_date + timedelta(days=6)

    elif week_number == 4:
        start_date = first_day_today_month + timedelta(days=21)
        if (start_date.day + 6) <= last_day_today_month:
            end_date = start_date + timedelta(days=6)
        else:
            end_date = first_day_today_month + timedelta(days=last_day_today_month - 1)

    return {'start': start_date, 'end': end_date}


def get_weeks_select_data(request):
    select_data = list()
    for week_number in range(1, 5):
        select_data.append(_get_week_by_number(week_number))

    return JsonResponse({'weeks': select_data})


def public_order_page_data(request, week_number):
    rows = dict()
    date_interval = _get_week_by_number(week_number)
    start_date = date_interval['start']
    end_date = date_interval['end']

    orders = Order.objects.values('created_at').filter(
        created_at__range=(start_date, end_date),
    ).annotate(date=TruncDay('created_at')).annotate(sum_price=Sum('price'))

    for i, order in enumerate(orders):
        clients = Client.objects.filter(orders__created_at=order.get('created_at'))\
            .order_by('name')\
            .values('name')\
            .distinct()

        rows[i] = {
            'date': str(order.get('date')),
            'client_names': '; '.join(c.get('name') for c in clients),
            'sum_price': order.get('sum_price')
        }

    return JsonResponse({'start': start_date, 'end': end_date, 'rows': rows})


@require_POST
@login_required(login_url='/admin/login', redirect_field_name='/order/')
def save_order(request, order_id):
    if request.user.is_authenticated:
        order = Order.objects.filter(pk=order_id).first()

        serializer = OrderSerializer(instance=order, data=request.POST, partial=True)
        if serializer.is_valid():
            serializer.save()
            clients = Client.objects.order_by('name')
            clients = ClientSerializer(clients, many=True)
            return JsonResponse({'orders': [serializer.data], 'clients': clients.data})
        else:
            return JsonResponse(serializer.errors)


@require_POST
def delete_order(request, order_id):
    result = False
    if request.user.is_authenticated:
        order = Order.objects.get(pk=order_id)
        if order:
            order.delete()
            result = True
    return JsonResponse({'result': result})

