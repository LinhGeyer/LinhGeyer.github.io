import pandas as pd
import glob
import os

def aggregate_amphibian_data(input_pattern, output_filename):
    # Find all files matching the pattern (e.g., 'amphibien_zaehlung_*.csv')
    all_files = glob.glob(input_pattern)
    
    if not all_files:
        print("No files found matching the pattern.")
        return

    li = []

    for filename in all_files:
        df = pd.read_csv(filename, sep=';', index_col=None, header=0)
        li.append(df)

    # Combine all individual CSVs into one large dataframe
    combined_df = pd.concat(li, axis=0, ignore_index=True)

    count_columns = [
        'Erdkröte weibchen', 'Erdkröte männchen', 'Erdkröte paare', 
        'Knoblauchkröte Anzahl', 'Grasfrosch Anzahl', 'Moorfrosch Anzahl', 
        'Grünfrosch Anzahl', 'Teichmolch Anzahl', 'Kammmolch Anzahl', 
        'Tot Erdkröte', 'Tot Knoblauchkröte', 'Tot Grasfrosch', 
        'Tot Moorfrosch', 'Tot Grünfrosch', 'Tot Teichmolch', 'Tot Kammmolch'
    ]

    # Convert counts to numeric, just in case there are empty strings or errors
    for col in count_columns:
        combined_df[col] = pd.to_numeric(combined_df[col], errors='coerce').fillna(0)

    # Group by 'Datum' and sum the species counts
    summary_df = combined_df.groupby('Datum')[count_columns].sum().reset_index()

    if 'Temperatur' in combined_df.columns:
        temp_avg = combined_df.groupby('Datum')['Temperatur'].mean().reset_index()
        summary_df = pd.merge(summary_df, temp_avg, on='Datum')

    summary_df.to_csv(output_filename, sep=';', index=False, encoding='utf-8-sig')
    print(f"Success! Summary saved to {output_filename}")

# Usage
aggregate_amphibian_data('amphibien_zaehlung_*.csv', 'Amphibien_Gesamtuebersicht_2026.csv')