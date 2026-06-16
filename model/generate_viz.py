import json
import os
import sys

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    import numpy as np
except ImportError:
    print("Error: matplotlib, seaborn, or numpy not found. Please install them using: pip install matplotlib seaborn numpy")
    sys.exit(1)

def generate_confusion_matrix():
    metrics_path = "saved_model/model_metrics.json"
    if not os.path.exists(metrics_path):
        print(f"Error: {metrics_path} not found.")
        return

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    cm = metrics.get("confusion_matrix")
    labels = metrics.get("class_labels")

    if not cm or not labels:
        print("Error: Confusion matrix or labels missing in metrics.")
        return

    # Create the heatmap
    plt.figure(figsize=(8, 6))
    sns.set_theme(style="white")
    
    # Custom color palette (beautiful blues)
    sns.heatmap(
        cm, 
        annot=True, 
        fmt='d', 
        cmap='Blues', 
        xticklabels=labels, 
        yticklabels=labels,
        annot_kws={"size": 14, "weight": "bold"},
        cbar_kws={'label': 'Number of Samples'}
    )

    plt.title('Guwahati Flood Risk Prediction: Confusion Matrix', fontsize=16, pad=20)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('Actual Label', fontsize=12)
    
    # Save the plot
def generate_performance_metrics():
    metrics_path = "saved_model/model_metrics.json"
    if not os.path.exists(metrics_path):
        print(f"Error: {metrics_path} not found.")
        return

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    per_class = metrics.get("per_class")
    if not per_class:
        print("Error: Per-class metrics missing in JSON.")
        return

    # Prepare data for plotting
    classes = [item["class"] for item in per_class]
    precision = [item["precision"] for item in per_class]
    recall = [item["recall"] for item in per_class]
    f1 = [item["f1"] for item in per_class]

    x = np.arange(len(classes))
    width = 0.25

    plt.figure(figsize=(10, 7))
    sns.set_theme(style="whitegrid")

    plt.bar(x - width, precision, width, label='Precision', color='#3498db', edgecolor='white')
    plt.bar(x, recall, width, label='Recall', color='#2ecc71', edgecolor='white')
    plt.bar(x + width, f1, width, label='F1-Score', color='#e74c3c', edgecolor='white')

    plt.title('Guwahati Flood Risk Prediction: Per-Class Performance Metrics', fontsize=16, pad=20)
    plt.xlabel('Risk Level', fontsize=12)
    plt.ylabel('Percentage (%)', fontsize=12)
    plt.xticks(x, classes)
    plt.ylim(95, 101)  # Focus on the high accuracy range
    plt.legend(loc='lower right')

    # Add text labels on bars
    for i in range(len(classes)):
        plt.text(i - width, precision[i] + 0.1, f'{precision[i]}%', ha='center', va='bottom', fontsize=9, fontweight='bold')
        plt.text(i, recall[i] + 0.1, f'{recall[i]}%', ha='center', va='bottom', fontsize=9, fontweight='bold')
        plt.text(i + width, f1[i] + 0.1, f'{f1[i]}%', ha='center', va='bottom', fontsize=9, fontweight='bold')

    output_path = "saved_model/performance_metrics.png"
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    print(f"Successfully generated performance metrics diagram at: {output_path}")

if __name__ == "__main__":
    generate_confusion_matrix()
    generate_performance_metrics()
