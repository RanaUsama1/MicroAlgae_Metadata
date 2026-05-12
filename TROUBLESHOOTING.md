# Troubleshooting Guide: Data Shows in ESummary but N/A in UI

## Problem

You can see data in the "E-utilities ESummary Response" debug panel, but the fields show "N/A" in the main display.

## Solution Steps

### Step 1: Open Browser Console
1. Press **F12** to open Developer Tools
2. Go to the **Console** tab
3. Fetch data for an accession
4. Look for these log messages:

```
=== Data Sources for GCF_XXXXXX ===
Datasets API available: true/false
ESummary available: true/false
Assembly Stats from Datasets: {...}
Stats from ESummary (Meta.Stats): {...}
Full ESummary data: {...}
=== Extracted Values for GCF_XXXXXX ===
Total Length: 12345678
Contig Count: 123
...
```

### Step 2: Check What's Available

Look at the logged values:
- If "Extracted Values" shows `null` but "Full ESummary data" has the data → **Field name mismatch**
- If "Full ESummary data" doesn't have the field → **Data not in API**

### Step 3: Find the Correct Field Name

In the console, expand the "Full ESummary data" object and look for the statistic you need.

#### Common ESummary Field Names:

The data might be in different locations:

```javascript
// Option 1: Meta.Stats (most common)
summaryData.Meta.Stats.total_length
summaryData.Meta.Stats.contig_count
summaryData.Meta.Stats.contig_n50

// Option 2: Direct properties
summaryData.TotalSeqLength
summaryData.ContigCount
summaryData.ContigN50

// Option 3: Nested in GB/RS_asm
summaryData.GB_asm  // GenBank assembly
summaryData.RS_asm  // RefSeq assembly
```

### Step 4: Report the Issue

If you find data in a field that's not being extracted, create an issue with:

1. **Accession number** you tested
2. **Field name** where the data exists (from console)
3. **Screenshot** of the debug panel and console

## Quick Fix: Modify the Code

If you found the field name, you can temporarily add it to the extraction:

Open `src/services/ncbiService.ts` and find the `getFieldValue()` calls. For example, if total length is in `TotalSeqLength`:

```typescript
const totalLength = parseIntSafe(assemblyStats?.total_sequence_length) ||
                   parseIntSafe(getFieldValue(stats, 
                     'total_length', 
                     'TotalLength', 
                     'total_sequence_length',
                     'TotalSeqLength'  // <-- Add your field name here
                   ));
```

## Common Field Name Variations

| Statistic | Possible Field Names |
|-----------|---------------------|
| Total Length | `total_length`, `TotalLength`, `total_sequence_length`, `TotalSeqLength` |
| Contig Count | `contig_count`, `ContigCount`, `number_of_contigs`, `ContigN` |
| Contig N50 | `contig_n50`, `ContigN50`, `contigN50` |
| Contig L50 | `contig_l50`, `ContigL50`, `contigL50` |
| Scaffold Count | `scaffold_count`, `ScaffoldCount`, `number_of_scaffolds`, `ScaffoldN` |
| Scaffold N50 | `scaffold_n50`, `ScaffoldN50`, `scaffoldN50` |
| Scaffold L50 | `scaffold_l50`, `ScaffoldL50`, `scaffoldL50` |
| GC Percent | `gc_percent`, `GcPercent`, `gc`, `GCPercent` |
| Coverage | `coverage`, `Coverage` |

## Example: Debugging GCF_000005845.2

### Console Output Should Show:

```
Fetching data for GCF_000005845.2...
Fetching from: https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/GCF_000005845.2
ESummary response for GCF_000005845.2: {
  uid: "158535",
  accession: "GCF_000005845.2",
  speciesname: "Escherichia coli str. K-12 substr. MG1655",
  Meta: {
    Stats: {
      total_length: "4641652",
      contig_count: "1",
      ...
    }
  }
}

=== Extracted Values for GCF_000005845.2 ===
Total Length: 4641652  ✅ Successfully extracted
Contig Count: 1        ✅ Successfully extracted
```

### If You See This Instead:

```
=== Extracted Values for GCF_000005845.2 ===
Total Length: null     ❌ Extraction failed!
Contig Count: null     ❌ Extraction failed!
```

**Then**: Look at the "Full ESummary data" log above and find where `4641652` actually is in the object structure.

## Need Help?

1. ✅ Checked browser console
2. ✅ Expanded "Full ESummary data" log
3. ✅ Found the field name where data exists
4. ✅ Confirmed data is actually in the API response

**Still stuck?** 

The `getFieldValue()` helper function should catch most variations. If it's not working, the field might be:
- Nested deeper in the object
- In an array that needs indexing
- In a different format (e.g., object instead of string/number)

Check the **field type** in the console - it should be a number or string, not an object or array.
