import argparse
import os
import glob
import pandas as pd

def aggregate_amphibian_data(input_dir):
    input_pattern = os.path.join(input_dir, 'amphibien_zaehlung_*.csv')
    all_files = glob.glob(input_pattern)
    
    if not all_files:
        print("No files found matching the pattern.")
        return

    li = []
    found_locations = set()

    for filename in all_files:
        # Load CSV using semicolon separator 
        df = pd.read_csv(filename, sep=';', index_col=None, header=0)
        
        # Check for location names to satisfy the naming requirement
        if 'Ort' in df.columns:
            locations = df['Ort'].dropna().unique()
            for loc in locations:
                clean_loc = str(loc).strip()
                if clean_loc:
                    found_locations.add(clean_loc)
        
        li.append(df)

    if not found_locations:
        raise ValueError("CRITICAL ERROR: No location ('Ort') found in any files.")

    location_list = list(found_locations)
    if len(location_list) > 1:
        print(f"⚠️  WARNING: Multiple locations found: {location_list}")

    location_name = location_list[0].replace(" ", "_")
    output_filename = f"Amphibienwanderung_2026_{location_name}.csv"

    combined_df = pd.concat(li, axis=0, ignore_index=True)

    # Define columns to sum (Species and Mortality) 
    count_columns = [
        'Erdkröte weibchen', 'Erdkröte männchen', 'Erdkröte paare', 
        'Knoblauchkröte Anzahl', 'Grasfrosch Anzahl', 'Moorfrosch Anzahl', 
        'Grünfrosch Anzahl', 'Teichmolch Anzahl', 'Kammmolch Anzahl', 
        'Tot Erdkröte', 'Tot Knoblauchkröte', 'Tot Grasfrosch', 
        'Tot Moorfrosch', 'Tot Grünfrosch', 'Tot Teichmolch', 'Tot Kammmolch'
    ]

    # Clean numeric data
    for col in count_columns + ['Temperatur']:
        if col in combined_df.columns:
            combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce').fillna(0)

    # Perform custom aggregation per Date
    # - Sum the animals
    # - Get the time range
    # - Average the temperature
    # - Join unique weather strings
    summary_df = combined_df.groupby('Datum').agg({
        **{col: 'sum' for col in count_columns},
        'Uhrzeit': lambda x: f"{x.min()} - {x.max()}",
        'Temperatur': 'mean',
        'Wetter': lambda x: ", ".join(set(x.dropna().astype(str)))
    }).reset_index()

    # Reorder columns so time, temperature and weather come directly after the date
    summary_df = summary_df[['Datum', 'Uhrzeit', 'Temperatur', 'Wetter'] + count_columns]

    # Save with semicolon separator to match requested style 
    summary_df.to_csv(output_filename, sep=';', index=False, encoding='utf-8-sig')
    print(f"✅ Success! Summary saved as: {output_filename}")


def main():
    parser = argparse.ArgumentParser(
        description='Aggregate amphibian count CSV files into one summary CSV.'
    )
    parser.add_argument(
        '--input-dir',
        default='.',
        help='Path to directory containing amphibien_zaehlung_*.csv files'
    )
    args = parser.parse_args()

    try:
        aggregate_amphibian_data(args.input_dir)
    except ValueError as e:
        print(e)

if __name__ == '__main__':
    main()