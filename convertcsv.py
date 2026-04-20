import pandas as pd
import glob
import os
import argparse

def aggregate_amphibian_data(directory_path):
    # Ensure the path is correctly formatted to look for the CSV files
    search_pattern = os.path.join(directory_path, 'amphibien_zaehlung_*.csv')
    all_files = glob.glob(search_pattern)
    
    if not all_files:
        print(f"No files found in: {directory_path}")
        return

    li = []
    found_locations = set()

    # Species and mortality columns to be summed 
    count_columns = [
        'Erdkröte weibchen', 'Erdkröte männchen', 'Erdkröte paare', 
        'Knoblauchkröte Anzahl', 'Grasfrosch Anzahl', 'Moorfrosch Anzahl', 
        'Grünfrosch Anzahl', 'Teichmolch Anzahl', 'Kammmolch Anzahl', 'Bergmolch Anzahl',
        'Tot Erdkröte', 'Tot Knoblauchkröte', 'Tot Grasfrosch', 
        'Tot Moorfrosch', 'Tot Grünfrosch', 'Tot Teichmolch', 'Tot Kammmolch', 'Tot Bergmolch'
    ]

    for filename in all_files:
        # Load CSV using semicolon separator 
        df = pd.read_csv(filename, sep=';', index_col=None, header=0)
        
        # Track unique locations from the 'Ort' column 
        if 'Ort' in df.columns:
            locations = df['Ort'].dropna().unique()
            for loc in locations:
                clean_loc = str(loc).strip()
                if clean_loc:
                    found_locations.add(clean_loc)
        
        li.append(df)

    # Error: Location must exist for the naming convention
    if not found_locations:
        raise ValueError("CRITICAL ERROR: No location ('Ort') found in any files. Aborting.")

    location_list = list(found_locations)
    if len(location_list) > 1:
        print(f"⚠️  WARNING: Multiple locations found: {location_list}")

    # Use the first found location for the filename
    location_name = location_list[0].replace(" ", "_")
    output_filename = f"Amphibienwanderung_2026_{location_name}.csv"

    combined_df = pd.concat(li, axis=0, ignore_index=True)

    remarks_column = 'Bemerkungen'

    # Clean numeric data for sums and average 
    for col in count_columns + ['Temperatur']:
        if col in combined_df.columns:
            combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce').fillna(0)

    # Daily Aggregation Logic 
    agg_dict = {
        **{col: 'sum' for col in count_columns},
        'Uhrzeit': lambda x: f"{x.min()} - {x.max()}",
        'Temperatur': 'mean',
        'Wetter': lambda x: ", ".join(set(x.dropna().astype(str)))
    }
    if remarks_column in combined_df.columns:
        agg_dict[remarks_column] = lambda x: "; ".join(pd.unique(x.dropna().astype(str)))

    summary_df = combined_df.groupby('Datum').agg(agg_dict).reset_index()
    if remarks_column not in summary_df.columns:
        summary_df[remarks_column] = ''

    # Create the Total Row
    total_row = pd.Series(dtype='object')
    total_row['Datum'] = 'GESAMTSUMME'
    
    # Sum the counts for the total row
    for col in count_columns:
        total_row[col] = summary_df[col].sum()
    
    # Calculate overall average temperature, leave Time/Weather empty for total
    total_row['Temperatur'] = summary_df['Temperatur'].mean()
    total_row['Uhrzeit'] = ''
    total_row['Wetter'] = ''
    total_row[remarks_column] = ''

    # Append the total row to the bottom
    summary_df = pd.concat([summary_df, total_row.to_frame().T], ignore_index=True)

    # Reorder columns so time, temperature and weather come directly after date
    ordered_columns = ['Datum', 'Uhrzeit', 'Temperatur', 'Wetter'] + count_columns + [remarks_column]
    summary_df = summary_df[ordered_columns]

    # Save output with semicolon separator and UTF-8-SIG for Excel compatibility
    summary_df.to_csv(output_filename, sep=';', index=False, encoding='utf-8-sig')
    
    print(f"✅ Success! Data aggregated for '{location_list[0]}'.")
    print(f"File saved as: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aggregate amphibian migration CSV files from a directory.")
    parser.add_argument("directory", help="Path to the directory containing the .csv files")
    
    args = parser.parse_args()
    
    try:
        aggregate_amphibian_data(args.directory)
    except ValueError as e:
        print(e)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")