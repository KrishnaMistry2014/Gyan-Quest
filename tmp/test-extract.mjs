import http from 'http';
import fs from 'fs';

const testPayload = JSON.stringify({
  fileName: 'Combustion_and_Flame_Class8.pdf',
  extractedText: 'Chapter 6: Combustion and Flame. In this chapter, we explore fuels, the conditions necessary for combustion, fire extinguishing methods, types of combustion, structure of a flame, fuel efficiency, and the environmental impacts of burning fuels. What is combustion? Combustion is a chemical process where a substance reacts with oxygen with the liberation of heat and light energy. The substance that burns is combustible or fuel. Fuels exist in solid (wood, coal), liquid (kerosene, petrol), or gaseous (LPG, CNG, biogas) states. Conditions required for combustion: 1. Combustible substance, 2. Supporter of combustion (Oxygen / Air), 3. Ignition temperature. The minimum temperature at which a combustible material catches fire is called its ignition temperature. Substances with very low ignition temperatures that readily catch fire are called inflammable substances (e.g., alcohol, petrol, LPG). Extinguishing Fire: Fire requires fuel, heat, and air. Removing any of these puts out the fire. Water lowers the temperature below ignition temperature and generates water vapour to displace oxygen. For electrical or oil fires, water is dangerous; Carbon Dioxide (CO2) is used as it is heavier than oxygen and smothers the fire without conducting electricity. Types of combustion: 1. Rapid Combustion (burns quickly producing heat and light, e.g., gas stove), 2. Spontaneous Combustion (bursts into flame without external heat, e.g., white phosphorus in air, coal dust in mines), 3. Explosion (sudden reaction with large amount of gas, heat, light, and sound, e.g., fireworks). Structure of a flame: A candle flame has three concentric zones. The outermost non-luminous blue zone is the zone of complete combustion and is the hottest part (used by goldsmiths with a blowpipe). The middle luminous yellow zone has moderate heat and incomplete combustion with glowing carbon particles. The innermost dark zone around the wick consists of unburnt wax vapours and is the least hot zone. Fuel Efficiency and Calorific Value: The amount of heat energy produced on complete combustion of 1 kg of fuel is called its calorific value, measured in kilojoules per kilogram (kJ/kg). Hydrogen has the highest calorific value (150,000 kJ/kg). Harmful effects of burning fuels: 1. Unburnt carbon particles cause respiratory ailments like bronchitis and asthma. 2. Incomplete combustion produces lethal carbon monoxide (CO) gas. 3. Excessive carbon dioxide (CO2) emission accelerates global warming. 4. Oxides of sulfur (SO2) and nitrogen (NO2) combine with atmospheric water to precipitate acid rain, damaging crops, aquatic life, and historical monuments like the Taj Mahal.'
});

const req = http.request('http://localhost:3000/api/extract-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testPayload),
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    fs.writeFileSync('/tmp/test-output.txt', `STATUS: ${res.statusCode}\nBODY: ${body}`);
    console.log('Finished writing response to /tmp/test-output.txt with status:', res.statusCode);
  });
});

req.on('error', (e) => {
  fs.writeFileSync('/tmp/test-output.txt', `ERROR: ${e.message}`);
});

req.write(testPayload);
req.end();
