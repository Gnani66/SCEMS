import os

from dotenv import load_dotenv

import psycopg
from psycopg.rows import dict_row


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured"
        )

    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
        connect_timeout=3,
    )