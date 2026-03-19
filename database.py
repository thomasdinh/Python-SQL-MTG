from dotenv import load_dotenv
import os

load_dotenv('login.env')

user = os.getenv("DB_USER")


if __name__ == '__main__':
    print(user)