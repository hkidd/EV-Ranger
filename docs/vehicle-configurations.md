# Vehicle cards and configurations

The buyer workspace groups the EPA snapshot into model/year cards. A shortlist
slot holds one exact EPA configuration for that vehicle. Changing configuration
replaces that slot, preserves active map selection, and updates the existing
range model and comparison evidence without requesting another road route.

`vehicleFamilies.ts` contains explicit navigation families for this snapshot.
Separate body styles stay separate (for example, EQS SUV and Taycan Cross Turismo).
These groupings are navigation labels, not verified manufacturer trim mappings.
All 568 EPA records remain available inside 146 model/year groups.

The trim/battery selector retains EPA model descriptions and drivetrain. A
wheel/tire selector separates explicitly named setups where the source supplies
them. It offers only setups attached to the selected configuration; changing
trim preserves a matching wheel setup where available, otherwise chooses the
first listed setup. Missing setup information reads “Setup not listed.” Battery
capacity appears only when manufacturer verification exists in the catalog.

Workspace persistence stores the exact EPA record ID for each shortlisted vehicle,
along with its configuration-specific terrain inputs. Route geometry is fetched
again after reload.

Manufacturer sources are still needed for verified retail trims, pack capacities,
wheel sizes, tire specifications, MSRP and availability. Separate trim and battery
controls should be introduced only where the source data supports that distinction.
Do not infer battery capacity or a generic wheel penalty from rated range.
