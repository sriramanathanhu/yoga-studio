#!/usr/bin/env python3

import csv
import json
import re
import os

def clean_text(text):
    """Clean and normalize text data"""
    if not text or text.strip() == '':
        return None
    cleaned = re.sub(r'\s+', ' ', str(text).strip())
    return cleaned if cleaned else None

def parse_goal_tags(goal_tags_str):
    """Parse goal tags from string format"""
    if not goal_tags_str or goal_tags_str.strip() == '':
        return []
    
    try:
        if goal_tags_str.startswith('[') and goal_tags_str.endswith(']'):
            return json.loads(goal_tags_str)
    except:
        pass
    
    tags = re.split(r'[,;|]+', goal_tags_str)
    return [tag.strip().lower() for tag in tags if tag.strip()]

def normalize_difficulty_level(level_str):
    """Normalize difficulty level"""
    if not level_str:
        return 'beginner'
    
    level = level_str.lower().strip()
    if 'beginner' in level or 'easy' in level or 'basic' in level:
        return 'beginner'
    elif 'intermediate' in level or 'medium' in level:
        return 'intermediate'
    elif 'advanced' in level or 'expert' in level or 'hard' in level:
        return 'advanced'
    else:
        return 'beginner'

def process_files():
    """Process the three CSV files and create SQL insert statements"""
    
    sql_statements = []
    processed_count = 0
    
    # File 1 structure
    print("Processing yoga_data_1.csv...")
    try:
        with open('/root/yogastudio/data/yoga_data_1.csv', 'r', encoding='utf-8', errors='ignore') as file:
            csv_reader = csv.reader(file)
            headers = next(csv_reader)
            
            for row_num, row in enumerate(csv_reader, start=2):
                try:
                    if len(row) < 26:
                        continue
                    
                    sanskrit_name = clean_text(row[1])
                    english_name = clean_text(row[2])
                    technique = clean_text(row[4])
                    benefits = clean_text(row[14])
                    image_url = clean_text(row[18])
                    goal_tags = parse_goal_tags(row[21])
                    level = normalize_difficulty_level(row[22])
                    
                    try:
                        time_minutes = int(float(row[23])) if row[23] and row[23].strip() else 30
                    except:
                        time_minutes = 30
                    
                    contraindications = clean_text(row[24])
                    sequence_stage = clean_text(row[25])
                    
                    if not sanskrit_name and not english_name:
                        continue
                    
                    # Create SQL insert statement
                    sql = f"""INSERT INTO asanas (english_name, sanskrit_name, description, goal_tags, difficulty_level, time_minutes, contraindications, sequence_stage, technique_instructions, benefits, image_url) VALUES (
                        {repr(english_name or sanskrit_name)},
                        {repr(sanskrit_name)},
                        {repr(technique)},
                        {repr(json.dumps(goal_tags))},
                        {repr(level)},
                        {time_minutes},
                        {repr(contraindications)},
                        {repr(sequence_stage or 'general')},
                        {repr(technique)},
                        {repr(benefits)},
                        {repr(image_url)}
                    );"""
                    
                    sql_statements.append(sql)
                    processed_count += 1
                    
                except Exception as e:
                    print(f"Error processing row {row_num} in file 1: {e}")
                    continue
    except Exception as e:
        print(f"Error reading file 1: {e}")
    
    print(f"Processed {processed_count} records from all files")
    
    # Write SQL statements to file
    with open('/root/yogastudio/insert_asanas.sql', 'w') as f:
        f.write("-- Clear existing data\n")
        f.write("DELETE FROM asanas;\n\n")
        f.write("-- Insert comprehensive yoga data\n")
        for sql in sql_statements:
            f.write(sql + "\n")
    
    print(f"Generated SQL file with {len(sql_statements)} insert statements")
    return len(sql_statements)

if __name__ == "__main__":
    count = process_files()
    print(f"Successfully processed {count} yoga asanas")