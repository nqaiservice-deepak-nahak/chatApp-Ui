import { SearchOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';
import type { InputProps } from 'antd';
import './searchBar.css';

export interface SearchBarProps extends Omit<InputProps, 'prefix' | 'suffix'> {
  loading?: boolean;
}

/** Shared themed search field used across the application. */
export default function SearchBar({
  loading = false,
  allowClear = true,
  maxLength = 150,
  className,
  ...inputProps
}: SearchBarProps) {
  const classes = ['themed-search', className].filter(Boolean).join(' ');

  return (
    <Input
      {...inputProps}
      allowClear={allowClear}
      maxLength={maxLength}
      className={classes}
      suffix={
        loading
          ? <Spin size="small" />
          : <SearchOutlined className="themed-search-icon" />
      }
    />
  );
}
