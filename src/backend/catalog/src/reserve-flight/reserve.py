"""
Module for handling flight reservations.
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

session = boto3.Session()
dynamodb = session.resource('dynamodb')
table = dynamodb.Table(os.environ['FLIGHT_TABLE_NAME'])


class FlightReservationException(Exception):
    """Base exception for flight reservation errors."""


class FlightFullyBookedException(FlightReservationException):
    """Exception raised when a flight is fully booked."""


class FlightDoesNotExistException(FlightReservationException):
    """Exception raised when a flight does not exist."""


def reserve_seat_on_flight(flight_id):
    """
    Reserve a seat on a flight.

    Args:
        flight_id (str): The ID of the flight.

    Returns:
        dict: A dictionary indicating the reservation status.

    Raises:
        FlightFullyBookedException: If the flight is fully booked.
        FlightReservationException: If there is an error with the reservation.
    """
    try:
        table.update_item(
            Key={"id": flight_id},
            ConditionExpression="id = :idVal AND seatCapacity > :zero",
            UpdateExpression="SET seatCapacity = seatCapacity - :dec",
            ExpressionAttributeValues={
                ":idVal": flight_id,
                ":dec": 1,
                ":zero": 0
            },
        )

        return {
            'status': 'SUCCESS'
        }
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException as error:
        # Could use TransactGetItems, or Get then Update to check existence.
        raise FlightFullyBookedException(f"Flight with ID: {flight_id} is fully booked.") from error
    except ClientError as error:
        raise FlightReservationException(error.response['Error']['Message']) from error


def lambda_handler(event, _context):
    """
    Lambda handler for reserving a seat on a flight.

    Args:
        event (dict): The event dictionary containing flight information.
        _context (object): The context object (unused).

    Returns:
        str: JSON string of the reservation status.

    Raises:
        ValueError: If the event arguments are invalid.
        FlightReservationException: If there is an error with the reservation.
    """
    if 'outboundFlightId' not in event:
        raise ValueError('Invalid arguments')

    try:
        result = reserve_seat_on_flight(event['outboundFlightId'])
    except FlightReservationException as error:
        raise FlightReservationException(error) from error

    return json.dumps(result)
