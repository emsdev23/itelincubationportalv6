import pandas as pd
import mysql.connector
import numpy as np
import re

# -----------------------
# Configuration
# -----------------------
file = r"C:/Users/TeNet/Downloads/Startup Database Sheet (3) (1).xlsx"

# -----------------------
# Connect to DB
# -----------------------
conn = mysql.connector.connect(
    host="121.242.232.211",
    user="emsroot",
    password="22@teneT",
    database="itelincubation",
    port=3306
)
cursor = conn.cursor()

# -----------------------
# Helper Functions
# -----------------------
def to_mysql_datetime(value):
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, str):
        val = value.strip().replace("(", "").replace(")", "")
        try:
            dt = pd.to_datetime(val, dayfirst=True, errors="coerce")
            if dt is not pd.NaT:
                return dt.strftime("%Y-%m-%d %H:%M:%S")
            return None
        except:
            return None
    try:
        dt = pd.to_datetime(value, errors="coerce")
        if dt is not pd.NaT:
            return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return None
    return None


def parse_founders(founder_text):
    """
    Takes a string with one or more founder names, replaces newlines,
    returns the first founder name and total number of founders.
    """
    if not founder_text:
        return None, 0
    # Replace newlines with space
    founder_text = founder_text.replace("\n", " ")
    # Common delimiters between multiple founders
    delimiters = ["&", ",", " and ", ";"]
    regex_pattern = '|'.join(map(re.escape, delimiters))
    # Split founder names
    founders = re.split(regex_pattern, founder_text)
    founders = [f.strip() for f in founders if f.strip()]
    first_founder = founders[0] if founders else None
    num_founders = len(founders)
    return first_founder, num_founders


def normalize(text):
    """Normalize text: lowercase, remove extra spaces and non-breaking spaces."""
    if not text:
        return None
    text = str(text)
    text = text.replace('\xa0', ' ')  # replace non-breaking spaces
    text = re.sub(r'\s+', ' ', text, flags=re.UNICODE)
    return text.strip().lower()


def get_fieldofwork_id(name):
    """Get fieldofworkrecid from fieldofwork table."""
    if not name:
        return None
    norm_name = normalize(name)
    cursor.execute("SELECT fieldofworkrecid, fieldofworkname FROM itelincubation.fieldofwork")
    rows = cursor.fetchall()
    for recid, db_name in rows:
        if normalize(db_name) == norm_name:
            return recid
    return None


def get_startupstage_id(name):
    """Get startupstagesrecid from startupstages table."""
    if not name:
        return None
    norm_name = normalize(name)
    cursor.execute("SELECT startupstagesrecid, startupstagesname FROM itelincubation.startupstages")
    rows = cursor.fetchall()
    for recid, db_name in rows:
        if normalize(db_name) == norm_name:
            return recid
    return None


# -----------------------
# Read Excel
# -----------------------
df = pd.read_excel(file)
df.columns = df.columns.str.replace("\n", " ").str.strip()
df = df.replace({np.nan: None})

# -----------------------
# Insert each row
# -----------------------
for _, row in df.iterrows():
    fieldofwork_id = get_fieldofwork_id(row.get("Field of Incubatee - Health tech/Fin tech ) (Y)"))
    stage_id = get_startupstage_id(row.get("Startup Stage (Y)"))
    founders = parse_founders(row["Contact person name (Y)"])

    print(row)

    # Uncomment when ready to update DB
    # cursor.execute(f"""
    #     UPDATE itelincubation.incubatees
    #     SET incubateesfoundername = '{founders[0]}'
    #     WHERE incubateesemail = '{row["Company email-id (Y)"]}'
    # """)

conn.commit()
cursor.close()
conn.close()
print("Import completed successfully!")
