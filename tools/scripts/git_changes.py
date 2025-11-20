#!/usr/bin/env python3

import subprocess
import sys
from datetime import datetime, timedelta
import argparse
from collections import Counter

def get_changed_files(days):
    # Calculate the date N days ago
    date_limit = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    # Get git log with changed files
    cmd = ['git', 'log', '--name-only', '--pretty=format:', f'--since="{date_limit}"']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        # Split output into lines and remove empty lines
        files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
        # Count occurrences of each file
        file_counts = Counter(files)
        return file_counts
    except subprocess.CalledProcessError as e:
        print(f"Error running git command: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='List files changed in git repository over the past N days')
    parser.add_argument('days', type=int, help='Number of days to look back')
    args = parser.parse_args()

    if args.days < 0:
        print("Error: Number of days must be positive")
        sys.exit(1)

    file_counts = get_changed_files(args.days)
    
    output_lines = []
    if not file_counts:
        output_lines.append(f"No files changed in the past {args.days} days")
    else:
        output_lines.append(f"\nFiles changed in the past {args.days} days:")
        output_lines.append("-" * 80)
        output_lines.append(f"{'File':<60} {'Commits':>10}")
        output_lines.append("-" * 80)
        
        # Sort files by number of commits (descending) and then alphabetically
        sorted_files = sorted(file_counts.items(), key=lambda x: (-x[1], x[0]))
        
        for file, count in sorted_files:
            output_lines.append(f"{file:<60} {count:>10}")
        
        output_lines.append("-" * 80)
        output_lines.append(f"Total unique files changed: {len(file_counts)}")
        output_lines.append(f"Total commits: {sum(file_counts.values())}")

    # Print output
    for line in output_lines:
        print(line)

    # Write output to git_changes_cache.txt
    with open('git_changes_cache.txt', 'w') as f:
        for line in output_lines:
            f.write(line + '\n')

if __name__ == "__main__":
    main() 