# DHL DAC 3.0 UiPath RPA Setup Guide

This guide explains how to configure and demonstrate the automated ingestion robot for the DHL DAC 3.0 Knowledge Base.

## Prerequisites
1. UiPath Studio 2022.10 or newer.
2. Access to the Google Drive or local folder used for DHL feedback documents.
3. Installed UiPath packages:
   - `UiPath.GSuite.Activities`
   - `UiPath.WebAPI.Activities`
   - `UiPath.Excel.Activities`
   - `UiPath.System.Activities`
   - `UiPath.UIAutomation.Activities`
   - `UiPath.Cryptography.Activities`

## Required Namespace
The workflow uses Google Drive model objects. Keep this namespace in the XAML header:

```xml
xmlns:ugdm="clr-namespace:UiPath.GSuite.Drive.Models;assembly=UiPath.GSuite"
```

## API Configuration
Run the Node.js app first:

```bash
npm start
```

Use this API endpoint in UiPath:

```text
http://localhost:3004/api/content
```

The web API also exposes a health check for demos:

```text
http://localhost:3004/api/health
```

## Expected RPA JSON Payload
```json
{
  "title": "Shipment address correction request",
  "summary": "Customer feedback indicates that a parcel address must be corrected before final delivery.",
  "raw_input": "Original text extracted by UiPath",
  "quality_score": 92,
  "status": "Draft",
  "steps": [
    "RPA: Retrieved source document",
    "RPA: Checked duplicate hash",
    "AI: Converted raw feedback into a knowledge article",
    "API: Stored article in DHL DAC 3.0"
  ],
  "tags": ["AddressError", "CustomerExperience", "RPA-Import"]
}
```

## Error Handling Demonstration
- Duplicate content within 14 days returns HTTP `409`.
- Missing `title` or `summary` returns HTTP `400`.
- Invalid status values return HTTP `400`.
- Database write failure returns HTTP `500`.
- The UiPath workflow should log failed files and continue processing the next item.

## Demo Checklist
1. Start the app at `http://localhost:3004`.
2. Open `rpa/Main.xaml` in UiPath Studio.
3. Confirm the HTTP endpoint is `http://localhost:3004/api/content`.
4. Run the workflow against the sample DHL feedback source.
5. Refresh the web app and verify the new article appears in Editor mode.
6. Open the article focus view and show steps, tags, status, and history.
