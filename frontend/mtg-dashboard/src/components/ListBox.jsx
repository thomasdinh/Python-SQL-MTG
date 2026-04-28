import { useState } from 'react';

function BasicListbox() {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedOptions(selected);
  };

  return (
    <div className='mt-6'>
      <select multiple onChange={handleChange} style={{ width: '200px', height: '120px' }}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
      </select>
      <p>Selected: {selectedOptions.join(', ')}</p>
    </div>
  );
}

export default BasicListbox;