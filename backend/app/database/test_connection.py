from app.database.connection import get_connection


def test_database_connection():

    with get_connection() as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                "SELECT NOW() AS current_time"
            )

            result = cursor.fetchone()

            print(
                "Database connected:",
                result["current_time"],
            )


if __name__ == "__main__":
    test_database_connection()